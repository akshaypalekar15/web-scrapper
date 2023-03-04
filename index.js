const request = require('request-promise');
const cheerio = require('cheerio');
const fs = require('fs');
const json2csv = require("json2csv");
const mongoose = require('mongoose');
const puppeteer = require('puppeteer-core');

const News = require('./models')


mongoose.connect('mongodb://localhost/news');
mongoose.connection.once('open', function () {
    console.log('Connection has been made, now make fireworks...');
}).on('error', function (error) {
    console.log('Connection error:', error);
});


const fetchIgnData = async (url, page) => {
    await page.goto(url, { waitUntil: 'networkidle2' });

    let data = await page.evaluate(() => {
        const totalCount = document.body.querySelectorAll('article.article').length;
        let articles = [];
        for (let i = 0; i < totalCount; i++) {
            articles.push({
                newsTitle: document.querySelectorAll('article.article > div.m > h3')[i].innerText,
                thumbImg: document.querySelectorAll('article.article > div.t > a > img')[i].src,
                summary: document.querySelectorAll('article.article > div.m > p')[i].innerText,
                lastUpdated: document.querySelectorAll('article.article > div.m > div.info > time')[i].innerText,
                redirectLink: document.querySelectorAll('article.article > div.m > h3 > a')[i].href,
            });
        }

        return {
            articles,
            Objlength: totalCount,
        };
    });

    for (let i = 0; i < data.articles.length; i++) {
        const gNews = new News({ ...data.articles[i], source: 'IGN' })
        gNews.save().then(() => {
            console.log('IGN data saved')
        });
    }
    // await browser.close();
}

const fetchGameRadarData = async (url, page) => {
    await page.goto(url, { waitUntil: 'networkidle2' });

    let data = await page.evaluate(() => {
        const totalCount = document.querySelectorAll('div.listingResult[data-page]').length;
        let articles = [];
        for (let i = 0; i < totalCount; i++) {
            articles.push({
                newsTitle: document.querySelectorAll('div.listingResult[data-page] > a > article > div.content > header > h3')[i].textContent,
                thumbImg: document.querySelectorAll('div.listingResult[data-page] > a > article > div.image > figure')[i].dataset.original,
                summary: '',
                lastUpdated: document.querySelectorAll('div.listingResult[data-page] > a > article > div.content > header > p > time')[i].textContent,
                redirectLink: document.querySelectorAll('div.listingResult[data-page] > a')[i].href,
            });
        }

        return {
            articles,
            Objlength: totalCount,
        };
    });

    for (let i = 0; i < data.articles.length; i++) {
        const gNews = new News({ ...data.articles[i], source: 'gameRadar' });
        gNews.save().then(() => {
            console.log('GameRadar data saved');
        });
    }
    // await browser.close();
}


(async () => {

    News.deleteMany({}).then(() => {
        console.log('removed');
    });

    const launchOptions = {
        headless: false,
        executablePath: 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe', // because we are using puppeteer-core so we must define this option
        args: ['--start-maximized']
    };

    const browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();

    // await fetchIgnData('https://in.ign.com/india', page);
    await fetchGameRadarData('https://www.gamesradar.com/news/', page);

    await browser.close();

})();
