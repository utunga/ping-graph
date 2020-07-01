import cytoscape from "cytoscape"
import {User, Edge } from "model"
import euler from "cytoscape-euler";
import World from "./world";
import {pad, debounce} from "./helpers";

import {enableRipple} from "@syncfusion/ej2-base";
enableRipple(true);
import {Slider} from "@syncfusion/ej2-inputs";

cytoscape.use(euler);

const DEFAULT_TOTAL_USERS = 20;
const DEFAULT_RATINGS_PER_USER = 4;
const DEFAULT_TRUST_DEPTH = 3;

let totalUsers = DEFAULT_TOTAL_USERS;
let ratingsPerUser = DEFAULT_RATINGS_PER_USER
let totalRatings = ratingsPerUser * totalUsers;
let trustDepth = DEFAULT_TRUST_DEPTH;

var globalUsers : Map<number, User> = new Map<number, User>();
var globalEdges : Map<number, Edge> = new Map<number, Edge>();
let usersMap = null;
let selectedUser = null;
let cy = null;
let removedEdges = null;

const world = new World();
const canvas = document.getElementById("trust-demo");

function createUsersHashMap(users) {
  const usersMap = {};
  users.forEach((user) => {
    usersMap[user.id] = user;
  });
  return usersMap;
}

function convertUsersToGraphElements(users) {
  const graphElements = {
    nodes: [],
    edges: []
  };
  users.forEach((user) => {
    graphElements.nodes.push({
      data: { 
        id: user.id,
        trustDegree: Math.floor(Math.random() * 4)
      }
    });
    // Object.keys(user.trustedUsers).forEach((userId) => {
    //   graphElements.edges.push({
    //     data: { 
    //       id: user.id + userId, 
    //       source: user.id, 
    //       target: userId 
    //     }
    //   });
    // });
    Object.keys(user.debtsOwing).forEach((userId) => {
      graphElements.edges.push({
        data: { 
          id: user.id + userId, 
          source: user.id, 
          target: userId 
        }
      });
    });
  })
  return graphElements;
}


/** Returns an appropriate color for a trust rating
 * -100 = Dark Red
 * -50 = Light Red
 * 0 = White
 * 50 = Light Green
 * 100 = Dark Green
 */
function getHexColorForTrustLevel(trustLevel) {
  let hexColorString = "#";
  if (trustLevel < 0) {
    hexColorString += (255).toString(16);
    hexColorString += pad(Math.floor(255 - Math.abs(trustLevel) / 100 * 255).toString(16), 2); // G
    hexColorString += pad(Math.floor(255 - Math.abs(trustLevel) / 100 * 255).toString(16), 2); // B
  } else {
    hexColorString += pad(Math.floor(255 - Math.abs(trustLevel) / 100 * 255).toString(16), 2); // R
    hexColorString += (255).toString(16);
    hexColorString += pad(Math.floor(255 - Math.abs(trustLevel) / 100 * 255).toString(16), 2); // B
  }

  return hexColorString;
}

function createGraph(users) {
  usersMap = createUsersHashMap(users);
  const graphElements = convertUsersToGraphElements(users);
  const graphStyle = [
    {
      selector: 'node',
      style: {
        'background-color': '#666',
        'label': 'data(id)',
        'font-size': '16px',
        'color': '#fff',
      }
    },
    {
      selector: 'edge',
      style: {
        'width': 2,
        'line-color': '#999',
        'target-arrow-color': '#999',
        'target-arrow-shape': 'triangle',
        'curve-style': 'bezier'
      }
    }
  ];
  const graphLayout = {
    name: 'random',
  };

  cy = cytoscape({
    container: canvas,
    elements: graphElements,
    style: graphStyle,
    layout: graphLayout
  });

  cy.on('tap', 'node', function(evt){
    var node = evt.target;
    const userId = node.id();
    const user = usersMap[userId];
    selectedUser = user;
    renderGraph(user);
  });

  cy.on('tap', function(evt){
    doNextStep(evt);
  });
}


const steps = [{fn: owe, params: [0,1,10]},
                {fn: owe, params: [1,2,10]},
                {fn: owe, params: [2,0,10]},
                {fn: owe, params: [0,1,10]},
                {fn: owe, params: [1,2,10]},
                {fn: owe, params: [2,0,10]}]
let nextStep = 0;
let done = false;

function doNextStep(evt) {
    if (!done) {
        steps[nextStep].fn.apply(this,steps[nextStep].params);
        nextStep++;
        const fromIdx = steps[nextStep].params[1];
        renderGraph(globalUsers[fromIdx])
    }
    done = nextStep>=steps.length;
}



function resetGraph() {
  Object.keys(usersMap).forEach((userId) => {
    cy.getElementById(userId).data('trustDegree', 0);
    cy.getElementById(userId).style('background-color', '#444');
  });

  if (removedEdges != null) {
    removedEdges.restore();
  }
  cy.edges().style({visibility: 'hidden'});
}


/** 
 * This makes all the relevant debt arrows visible
 */
function renderDebtsOwing(user, depth) {
  const debts = user.getDebts();
  Object.entries(debts).forEach(([friendId, debtAmt]) => {
    if (cy.getElementById(friendId).data('trustDegree') < depth) {
      cy.getElementById(friendId).data('trustDegree', depth);
    }
    
    const edgeId = user.id + friendId;
    const color = getHexColorForTrustLevel(debtAmt);
    cy.getElementById(edgeId).style({
      visibility: 'visible',
      lineColor: color,
      targetArrowColor: color,
    });
  

    if (depth <= 1) return; // We've gone as deep as we need to go, so return

    const friend = usersMap[friendId];
    renderDebtsOwing(friend, depth-1);
  });
}



// Collect all edges that are still hidden (because they aren't relevant to 
// the graph for the selected user) and remove them from the graph so they aren't
// used for positional calculations
function removeHiddenEdges() {
  removedEdges = cy.edges(':hidden').remove()
}


/**
 * Core graph rendering function. Resets it to defaults, then colors and changes
 * the graph layout for the selected user. 
 * 
 * @param {User} user 
 */
function renderGraph(user) {
  const userId = user.id;
  //user.calculateTrust(trustDepth);

  resetGraph();

  // Set main user to center, TRUST_DEPTH + 1 because the outer layer is reserved for unknown strangers
  cy.getElementById(userId)
    .data('trustDegree', trustDepth + 1)
    .style('background-color', '#4444ff');

  renderDebtsOwing(user, trustDepth);

  // Set colors based on debt owing (green == more debt) its fine
  const debts = user.getDebts();
  Object.entries(debts).forEach(([userId, debtAmt]) => {
    const backgroundColor = getHexColorForTrustLevel(debtAmt);
    cy.getElementById(userId).style('background-color', backgroundColor)
  });

  removeHiddenEdges();

  const layout = cy.elements().layout({
    name: 'euler',
    springLength: 200,
    springCoeff: 0.00005,
    mass: 6,
    gravity: -4,
    pull: 0.002,
    dragCoeff: 0.001,
    timeStep: 30,
    refresh: 20,
    movementThreshold: 5,
    animate: 'end',
    animationDuration: 500,
  });
  layout.run();
}

function owe(from, to, amt) {
  const fromUser = globalUsers[from];
  const toUser = globalUsers[to];
  new Debt(user, amt);
  fromUser.oweUser(toUser, amt);
  cy.add({
    group: "edges",
    data: { 
      //id: fromUser.id + toUser.id, 
      source: fromUser.id, 
      target: toUser.id 
    }
  });
}

async function createWorld(totalUsers, totalRatings) {
  globalUsers = await world.stooges();
  globalEdges = await world.emptyEdges();
  createGraph(globalUsers);

  
  //iterator.start();

  // owe.call(this,1,2,10);
  // owe.call(this,2,0,10);
  // owe.call(this,0,1,10);
  // owe.call(this,1,2,10);
  // owe.call(this,2,0,10);

}

createWorld(totalUsers, totalRatings);
const updateWorld = debounce(createWorld, 250);
