
function pad(num: string, size: number){ return ('000000000' + num).substr(-size); }

function debounce(callback, time) {
  let interval;
  return (...args) => {
    clearTimeout(interval);
    interval = setTimeout(() => {
      interval = null;
      callback(...args);
    }, time);
  };
}

export {pad, debounce};