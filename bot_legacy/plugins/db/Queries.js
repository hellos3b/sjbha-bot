import mongoose from 'mongoose'

export default class {

    constructor(schemaName) {
        this.name = schemaName
        this.Schema = mongoose.model(schemaName)
    }

    find(q) {
        return this.Schema.find(q).exec()
    }

    findOne(q) {
        return this.Schema.findOne(q).exec()
    }

    getAll() {
        return this.Schema.find().exec()
    }

    remove(q) {
        return this.Schema.find(q).remove().exec();
    }

    create(json) {
        let model = new this.Schema(json)
        return model.save()
    }

    createOrUpdate(q, json) {
        return new Promise((resolve, reject) => {
            this.Schema.findOne(q, (err, result) => {
                let doc = (result) ? result.set(json) : new this.Schema(json);
            
                doc.save((saveErr, savedStat) => {
                    if (saveErr) throw saveErr;
                    resolve();
                })
            })
        })
    }

    update(q, json) {
        console.log("Updating", q, json)
        return new Promise((resolve, reject) => {
            return this.Schema.findOne(q, (err, result) => {
                if (!result) throw err
                let doc = result.set(json)
            
                doc.save((saveErr, savedStat) => {
                    if (saveErr) throw saveErr;
                    resolve();
                })
            })
        })
    }
}