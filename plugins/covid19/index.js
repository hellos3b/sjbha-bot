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
            options: bastion.parsers.args(["country"]),
			
            // Core of the command
            resolve: async function(context, country, name) {
				
				function isEmpty(str) {
					return (!str || 0 === str.length);
				}
				
				function capitalize_Words(str)
				{
				 return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
				}
				
				const url = "https://pomber.github.io/covid19/timeseries.json"
				const jsonObj = await Axios.get(url).then(r => r.data)	

				const countries = context.message.split(" ")
				const countJ = countries.slice(1).join(' ')	
				const upper = capitalize_Words(countJ);
				
				if (isEmpty(country)) {
					
					const jsonObjUS = jsonObj['US'];
					
					const latest = jsonObjUS[jsonObjUS.length-1];
					const yest = jsonObjUS[jsonObjUS.length-2];
					
					const cdiff = latest.confirmed - yest.confirmed
					const ddiff = latest.deaths - yest.deaths
					const rdiff = latest.recovered - yest.recovered
					
					return "Currently in the US there are **"+latest.confirmed+"** *"+"(+"+cdiff+")*"+" cases of COVID19, with **"+latest.deaths+"** *(+"+ddiff+")*"+" deaths, and **"+latest.recovered+"** *(+"+rdiff+")*"+" recoveries as of **"+latest.date+"**."
				
				} else if (jsonObj.hasOwnProperty(upper)) {

					const uCount = jsonObj[upper];
					
					const latest = uCount[uCount.length-1];
					const yest = uCount[uCount.length-2];
					
					const cdiff = latest.confirmed - yest.confirmed
					const ddiff = latest.deaths - yest.deaths
					const rdiff = latest.recovered - yest.recovered

					return ( "Currently in "+upper+" there are **"+latest.confirmed+"** *"+"(+"+cdiff+")*"+" cases of COVID19, with **"+latest.deaths+"** *(+"+ddiff+")*"+" deaths, and **"+latest.recovered+"** *(+"+rdiff+")*"+" recoveries as of **"+latest.date+"**." )	
					
				} else {
					return "Country data not found in JHU database."
				}
			}
		}
    ]
}
