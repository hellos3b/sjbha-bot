// Generated by ReScript, PLEASE EDIT WITH CARE
'use strict';


function make(param) {
  return {
          title: "",
          description: "",
          date: new Date().toISOString()
        };
}

function render(details) {
  return {
          title: details.title,
          description: details.description
        };
}

exports.make = make;
exports.render = render;
/* No side effect */
