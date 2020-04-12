/**
 *  Use this as the base template for a new command
 * 
 */

import deepmerge from 'deepmerge';
import Axios from "axios";


const baseConfig = {
    command: "covid19"
}

export default function(bastion, opt={}) {
    const config = deepmerge(baseConfig, opt)
    const cmd = bastion.command(config.command)

	

	
    return [

        {
            // Command to start it
            command: config.command, 

            // Core of the command
            resolve: async function(context, name) {
/* 				const jsonObj = require("./timeseries.json"); */

				const url = "https://pomber.github.io/covid19/timeseries.json"
				const jsonObj = await Axios.get(url).then(r => r.data)	
				const jsonObjUS = jsonObj['US'];

				const latest = jsonObjUS[jsonObjUS.length-1];
				const yest = jsonObjUS[jsonObjUS.length-2];
				
				const cdiff = latest.confirmed - yest.confirmed
				const ddiff = latest.deaths - yest.deaths
				const rdiff = latest.recovered - yest.recovered
				
				
                return "Currently in the US there are **"+latest.confirmed+"** *"+"(+"+cdiff+")*"+" cases of COVID19, with **"+latest.deaths+"** *(+"+ddiff+")*"+" deaths, and **"+latest.recovered+"** *(+"+rdiff+")*"+" recoveries as of **"+latest.date+"**."

        }
		}
    ]
}
