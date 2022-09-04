export default {

    objToParams(obj) {
        return Object.keys(obj)
            .map(key => key + '=' + encodeURIComponent(obj[key]))
            .join('&')
    },

    get(path, objParams) {
        const baseUrl = process.env.DOMAIN 

        return baseUrl + path + "?" + this.objToParams(objParams);
    }

}