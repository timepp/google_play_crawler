/*
 * Javascript file for fetch google play store reviews for arbitrary app.
 *
 * How to use it in Firefox:
 * 1. Open google play web page and navigate to the app you want to crawl
 * 2. Menu -> Web developer -> Scrashpad (or SHIFT+F4) to open a scratchpad window
 * 3. paste this entire js file there
 * 4. Modify the number `review_count_to_fetch` below to desired value if needed
 * 5. Click "Run" in the Scratchpad window
 * 6. Open the developer console by pressing "CONTROL+SHIFT+F4", wait until something printed in the console
 * 7. Right click the object, select "Copy Object"
 * 8. Save the information in clipboard. It's JSON which can be easily consumed.
 *
 *
 * How to use it in Chrome:
 * 1. Open google play web page and navigate to the app you want to crawl
 * 2. Developer tools -> sources -> Snippets -> New snippet
 * 3. paste this entire js file there
 * 4. Modify the number `review_count_to_fetch` below to desired value if needed
 * 5. Click "Run" in the Snippet context menu
 * 6. Switch to Console view
 * 7. Right click the object, select "Store as global variable"
 * 8. Execute `JSON.stringify(temp1, "", "\n")` in console and save the information in output window.
 */

var review_count_to_fetch = 10;
var reviews = [];

window.scrollTo(0, 0);
doWork();

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function doWork() {
  await loadAllReviews();
  // We need to get reviews from newest to oldest, so we need operate the droplist to make sure "Newest" is selected
  await sortByNewest();
  await sleep(1000);
  
  while (reviews.length < review_count_to_fetch) {
    fetchReviews();
    await loadMore();
  }
  
  console.log(reviews);
}

// If there is "SHOW MORE", click it, then scroll until "SHOW MORE" come again
async function loadMore() {
  var showmore = getShowMoreButton();
  //console.log(showmore);
  if (showmore) showmore.click();
  await sleep(1000);
  
  while (!getShowMoreButton()) {
    window.scrollTo(0,document.body.scrollHeight);
    await sleep(2000);
  }
}

async function loadAllReviews() {
  var readall = findSpan("READ ALL REVIEWS");
  if (readall) readall.click();
  await sleep(1000);
}

async function sortByNewest() {
  var status = getSortMenuStatus();
  //console.log(status);
  
  if (status.dropdownOpened) {
    status.optionNewest.click();
  } else {
    status.dropdownTitle.click();
    await sleep(1000);
    var status2 = getSortMenuStatus();
    status2.optionNewest.click();
  }  
}

function fetchReviews() {
  var container = getReviewContainer();
  var nodes = container.childNodes;
  for (var i = reviews.length; i < nodes.length; i++) {
    var node = nodes[i];
    var review = fetchSingleReview(node);
    reviews.push(review);
  }
}

// fetch single review from a node
function fetchSingleReview(node) {
  var review = {};
  
  var ratingDiv = node.querySelector("div[role='img']");
  review.rating = parseInt(ratingDiv.getAttribute("aria-label").match(/Rated ([12345]) stars out of five stars/)[1]);
  
  var tempnode1 = ratingDiv.parentNode.parentNode;
  review.date = tempnode1.nextSibling.innerText;
  review.name = tempnode1.parentNode.previousSibling.innerText;
  
  var tempnode2 = tempnode1.parentNode.parentNode.parentNode;
  review.text = tempnode2.nextSibling.querySelector("span").innerText;
  
  var date = new Date(Date.parse(review.date));
  review.date = date.toISOString().substr(0, 10);
  
  return review;
}

function getShowMoreButton() {
  var btn = null;
  document.querySelectorAll("span").forEach(item=>{
    if (item.innerText == "SHOW MORE") btn = item;
  });
  return btn;
}

function findSpan(title) {
  var ret = null;
  document.querySelectorAll("span").forEach(item=>{
    if (item.innerText == title) ret = item;
  });
  return ret;
}

function getReviewContainer() {
  var container = null;
  document.querySelectorAll("h3").forEach(item=>{
    if (item.innerText == "User reviews") container = item.nextSibling;
  });
  return container;
}

function getSortMenuStatus() {
  var ret = {
    dropdownOpened: false,
    dropdownTitle: null,
    optionMostHelpfulFirst: null,
    optionRating: null,
    optionNewest: null,
    optionSelected: null
  };
  
  var optionMostHelpfulFirstText = "Most helpful first";
  var optionRatingText = "Rating";
  var optionNewestText = "Newest";
  
  var contents = document.querySelectorAll("content");

  contents.forEach(item=>{
    var text = item.innerText;
    if (text == optionMostHelpfulFirstText || text == optionRatingText || text == optionNewestText) {
      //console.log(item.parentNode);
      //console.log(item);
      if (item.parentNode.getAttribute("aria-selected") == "true" && item.parentNode.getAttribute("role") != "option") {
        ret.dropdownOpened = true;
        ret.dropdownTitle = item;
      }

      if (item.parentNode.getAttribute("role") == "option") {
        if (item.parentNode.getAttribute("aria-selected") == "true") {
          ret.optionSelected = item;
        }
        if (text == optionMostHelpfulFirstText) ret.optionMostHelpfulFirst = item;
        if (text == optionRatingText) ret.optionRating = item;
        if (text == optionNewestText) ret.optionNewest = item;
      }
    }
  });
  
  if (!ret.dropdownOpened) ret.dropdownTitle = ret.optionSelected;
  return ret;
}

