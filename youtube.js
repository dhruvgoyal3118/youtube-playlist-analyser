const puppeteer = require('puppeteer');
const fs = require('fs');
const pdf = require('pdfkit');

let ctab,link='https://www.youtube.com/playlist?list=PLBlnK6fEyqRj9lld8sWIUNwlKfdUoPd1Y';
let x=0;
(async function () {    

    try {
        let browseropen =  puppeteer.launch({
            headless:false,
            defaultViewport:null,
            args:['--start-maximized']
        })

        let browserInstance  = await browseropen;
        let allTabs = await browserInstance.pages();
        ctab = allTabs[0];
        await ctab.goto(link);
        // console.log(1);
        await ctab.waitForSelector('div.dynamic-text-container.style-scope.yt-dynamic-sizing-formatted-string#container>yt-formatted-string#text');
        // await ctab.waitForSelector('h1#title');

        // evaluate is a promise that evaluates a function given along with its arguments;
        let name = await ctab.evaluate(function(selector){ return document.querySelector(selector).innerText;},'div.dynamic-text-container.style-scope.yt-dynamic-sizing-formatted-string#container>yt-formatted-string#text')
        // let name = await ctab.evaluate(function(selector){ return document.querySelector(selector).innerText;},'h1#title')
        console.log(name);
        let AllData =  await ctab.evaluate(getData,'yt-formatted-string.byline-item.style-scope.ytd-playlist-byline-renderer')
        // let AllData =  await ctab.evaluate(getData,'#stats .style-scope.ytd-playlist-sidebar-primary-info-renderer')
        // console.log(typeof(AllData),AllData.noOfVideos,AllData.noOfViews);
        let totalVideos = AllData.noOfVideos.split(" ")[0];
        // console.log(totalVideos);

        let VidIn1Scroll  = await getCvideoLength();
        // console.log(VidIn1Scroll);

        
        while (totalVideos-VidIn1Scroll>=20) {
            
           
            // console.log(totalVideos);
            // console.log(VidIn1Scroll);
            // console.log(totalVideos-VidIn1Scroll);
         await ScrollToBottom();
         VidIn1Scroll = await getCvideoLength(); 
        //  console.log(VidIn1Scroll);
        }
        let final_list = await getStats();
        // console.log(final_list.length);
        // console.log(final_list);

        let file_name = (name+".pdf").trim();
        let pdfDOC = new pdf
        pdfDOC.pipe(fs.createWriteStream(file_name));
        pdfDOC.text(JSON.stringify(final_list));
        pdfDOC.end();

    } catch (error) {
            console.log('error is there');
    }

})()

function getData(selector){

    let AllElem = document.querySelectorAll(selector);
    let noOfVideos = AllElem[0].innerText;
    let noOfViews = AllElem[1].innerText;
    return{
        noOfVideos,
        noOfViews
    } 
}

async function getCvideoLength()
{
    let length = await ctab.evaluate(getlength,'#container>#thumbnail span.style-scope.ytd-thumbnail-overlay-time-status-renderer');
    return length;

}

async function ScrollToBottom(){
    await ctab.evaluate(goToBottom);
    function goToBottom(){
        window.scrollBy(0,window.innerHeight);
    }
}

function getlength(selector)
{
    let durationElem = document.querySelectorAll(selector);
    return durationElem.length;
}

async function getStats(){
    let list = ctab.evaluate(getNameAndTime,'a#video-title.yt-simple-endpoint.style-scope.ytd-playlist-video-renderer','#container>#thumbnail span.style-scope.ytd-thumbnail-overlay-time-status-renderer');
    // let list = ctab.evaluate(getNameAndTime,'#video-title','#container>#thumbnail span.style-scope.ytd-thumbnail-overlay-time-status-renderer');
    return list;
}

function getNameAndTime(videoselector,durationselector){
    let videoelem = document.querySelectorAll(videoselector);
    let durationelem = document.querySelectorAll(durationselector);
    let currentList=[];
    for(let i=0;i<durationelem.length;i++)
    {
        let videoTitle = videoelem[i].innerText;
        let duration = durationelem[i].innerText;
        currentList.push({videoTitle,duration});
    }
    return currentList;
}