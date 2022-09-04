export default {

    /**
     * Wraps a value as an array if it's not already one
     * @param {(Array|*)} opt 
     * @returns {Array}
     */
    optionalArray(opt) {
        opt = opt || []
        return (Array.isArray( opt )) ?  opt : [opt]
    }  

}