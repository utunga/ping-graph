import cytoscape from 'cytoscape';
import {User, Ping } from './models';
import euler from 'cytoscape-euler';
import World from './world';
import {pad, debounce} from './helpers';

import {enableRipple} from '@syncfusion/ej2-base';
enableRipple(true);
import {Slider} from '@syncfusion/ej2-inputs';

cytoscape.use(euler);

const DEFAULT_TOTAL_USERS = 20;
const DEFAULT_RATINGS_PER_USER = 4;
const DEFAULT_TRUST_DEPTH = 3;

let totalUsers = DEFAULT_TOTAL_USERS;
let ratingsPerUser = DEFAULT_RATINGS_PER_USER;
let totalRatings = ratingsPerUser * totalUsers;
let trustDepth = DEFAULT_TRUST_DEPTH;

let usersMap = null;
let selectedUser = null;
let cy = null;
let removedEdges = null;

const world: World = new World();
const canvas = document.getElementById('trust-demo');

function createUsersHashMap(users: User[]) {
  const usersMap = {};
  users.forEach((user) => {
    usersMap[user.id] = user;
  });
  return usersMap;
}

function getGraphElements(world: World) {
  const graphElements = {
    nodes: [],
    edges: []
  };
  world.users.forEach(user => {
    graphElements.nodes.push({
      data: {
        name: user.name,
        id: user.id,
        trustDegree: Math.floor(Math.random() * 4)
      }
    });
    world.pings.forEach( ping => {
      graphElements.edges.push({
        data: {
          id: ping.from.id + ping.to.id,
          source: ping.from.id,
          target: ping.to.id
        }
      });
    });
  });
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
  let hexColorString = '#';
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

function createGraph(world) {
  usersMap = createUsersHashMap(world.users);
  const graphElements = getGraphElements(world);
  const graphStyle = [
    {
      selector: 'node',
      style: {
        'background-color': '#666',
        'label': 'data(name)',
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

  cy.on('tap', 'node', function(evt) {
    var node = evt.target;
    const userId = node.id();
    const user = usersMap[userId];
    selectedUser = user;
    renderGraph();
  });

  cy.on('tap', function(evt) {
    doNextStep();
  });
}


const steps = [ {fn: owe, params: ['Nico', 'Miles', 200]},
                {fn: owe, params: ['Anna', 'Nico', 2000]},
                {fn: owe, params: ['Miles', 'Anna', 500]}];
let nextStep = 0;
let done = false;

function doNextStep() {
    if (!done) {
        steps[nextStep].fn.apply(this, steps[nextStep].params);
        nextStep++;
        // renderGraph();
    }
    done = nextStep >= steps.length;
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
function renderDebtsOwing() {
  console.log(world.pings);
  world.pings.forEach((ping: Ping, id: number) => {
    cy.add({
      group: 'edges',
      data: {
        id: id,
        source: ping.from.id,
        target: ping.to.id
      }
    });
  });
}

    // if (cy.getElementById(friendId).data('trustDegree') < depth) {
    //   cy.getElementById(friendId).data('trustDegree', depth);
    // }
    // const edgeId = user.id + friendId;
    // const color = getHexColorForTrustLevel(debtAmt);
    // cy.getElementById(edgeId).style({
    //   visibility: 'visible',
    //   lineColor: color,
    //   targetArrowColor: color,
    // });



// Collect all edges that are still hidden (because they aren't relevant to
// the graph for the selected user) and remove them from the graph so they aren't
// used for positional calculations
function removeHiddenEdges() {
  removedEdges = cy.edges(':hidden').remove();
}


/**
 * Core graph rendering function. Resets it to defaults, then colors and changes
 * the graph layout for the selected user.
 *
 * @param {User} user
 */
function renderGraph() {

  resetGraph();

  // // Set main user to center, TRUST_DEPTH + 1 because the outer layer is reserved for unknown strangers
  // cy.getElementById(userId)
  //   .data('trustDegree', trustDepth + 1)
  //   .style('background-color', '#4444ff');

  renderDebtsOwing();

  // Set colors based on debt owing (green == more debt) its fine
  // const debts = user.getDebts();
  // Object.entries(debts).forEach(([userId, debtAmt]) => {
  //   const backgroundColor = getHexColorForTrustLevel(debtAmt);
  //   cy.getElementById(userId).style('background-color', backgroundColor);
  // });

  // removeHiddenEdges();

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

function owe(from: string, to: string, amt: number) {
  var ping = world.addPing(from, to, amt);
  cy.add({
    group: 'edges',
    data: {
      id: ping.id,
      source: ping.from.id,
      target: ping.to.id
    }
  })
}

async function createWorld() {
  createGraph(world);
}

createWorld();
const updateWorld = debounce(createWorld, 250);
