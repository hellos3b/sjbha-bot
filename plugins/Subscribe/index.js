/**
 *  Let people subscribe/unsubscribe from taggable roles
 * 
 */

/** @typedef {import('@/types').PluginResolver} PluginResolver */

import deepmerge from 'deepmerge'
import chalk from 'chalk'
import './subscribeTagSchema'

const baseConfig = {
    command: 'subscribe',
    commandUnsubscribe: 'unsubscribe',
    subscriptions: {}
}

/** @type {PluginResolver} */
export default function(bastion, opt={}) {
    const config = deepmerge(baseConfig, opt)
    const q = new bastion.Queries('subscribeTag')

    return [

        // Subscribe
        {
            command: config.command,

            validate: async function(context, tag) {
                //pull all tags from the database into an array
                let tags = await q.find()

                //If the command is called on its own, run help (can't do this in the normal way because we need async to wait for the tags)
                if(!tag) {
                    let tagString = 'Tags you can subscribe to: '
                    //iterate through all the tags adding them to the string.
                    tags.forEach(iTag => tagString += iTag.name + ', ')
                    return tagString.substring(0,tagString.length-2)
                }

                //if the tag doesn't exist (and we didnt use the add switch)
               if (!tags.find(iTag => iTag.name == tag) && tag.substring(0,4) != '-add') return `Couldn't find tag called '${tag}'`
            },

            resolve: async function(context, tag) {  
                //pull all tags from the database into an array
                let tags = await q.find()
                //if we used the add switch ditch this and head to the add role route
                if (tag.substring(0,4) === '-add') return this.route("add") 

                //Find the ID for the tag in question and add it to the user
                const tagId = tags.find(iTag => iTag.name == tag).id
                await bastion.addRole(context.userID, tagId)

                return `${context.user} subscribed to '${tag}'`
            }
        },

        // Unsubscribe 
        {
            command: config.commandUnsubscribe,

            validate: async function(context, tag) {
                let tags = await q.find()
                //If the command is called on its own run help (can't do this in the normal way because we need async to wait for the tags)
                if(!tag) {
                    let tagString = 'Tags you can unsubscribe from: '
                    //iterate through all the tags adding them to the string.
                    tags.forEach(iTag => tagString += iTag.name + ', ')
                    return tagString.substring(0,tagString.length-2)
                }
                if (!tags.find(iTag => iTag.name == tag)) return `Couldn't find tag called '${tag}'`
            },

            resolve: async function(context, tag) {  
                let tags = await q.find()
                const tagId = tags.find(iTag => iTag.name == tag).id
                await bastion.removeRole(context.userID, tagId)

                return `${context.user} unsubscribed from '${tag}'`
            }

        },

        // Add a tag to the list of subscribables
        {
            action: "subscribe:add", 

            validate: async function(context, message) {
                let tags = await q.find()
                const [cmd, roleName, roleId] = message.split(' ')

                //test that the command is accompanied with a role name and ID, make sure the ID is a number
                if(!roleName || isNaN(roleId)) return "Correct syntax is: subscribe -add RoleName RoleID"

                //Make sure the tag doesnt already exist
                if(tags.find(iTag => iTag.name == roleName)) return "Tag already exists."
            },

            resolve: async function(context, message) {
                //was restrictions here for a couple users. This is the dangerous function
                const [cmd, roleName, roleId] = message.split(' ')

                await q.create({ name: roleName, id: roleId})
                return `Added subscribable tag!`
            }
        }

    ]
}