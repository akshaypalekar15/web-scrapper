const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const NewsSchema = new Schema({
    newsTitle: String,
    thumbImg: String,
    summary: String,
    lastUpdated: String,
    redirectLink: String,
    source: String,
});

const News = mongoose.model('news',NewsSchema);

module.exports = News;