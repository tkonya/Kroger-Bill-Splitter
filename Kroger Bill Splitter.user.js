// ==UserScript==
// @name         Kroger Bill Splitter
// @namespace    http://trevorkonya.com
// @version      0.2
// @description  Help split grocery bills on Kroger.com
// @author       Trevor Konya
// @match        https://www.kroger.com/mypurchases*
// @grant        none
// ==/UserScript==

console.log('running Kroger Bill Splitter 0.2 ...');

//setTimeout(function() {
//    var receiptElements = document.getElementsByClassName('ReceiptList-receiptDateLink');
//    console.log('found ' + receiptElements.length + ' receipt elements');
//    for (var i = 0; i < receiptElements.length; ++i) {
//        receiptElements[i].setAttribute("onclick", "tryAppendingSliders();");
//    }
//}, 1000);

function appendSliders() {

    // make the receipt items wider
    document.querySelector("div.PurchaseDetail-footerContainer").style.maxWidth = "1080px";


    console.log('maybe appending sliders');

    var lineItems = document.querySelector("div[role='rowgroup']").childNodes;
    console.log('found ' + lineItems.length + ' line items');

    if (lineItems.length < 1) {
        return 0;
    }
    if (document.getElementsByClassName('leftPrice').length > 0 || document.getElementsByClassName('rightPrice').length > 0) {
        return 0;
    }

    // var pricesPaid = document.getElementsByClassName('PurchasedItemRow-itemPricePaid');
    let pricesPaid = getPricesPaid(lineItems);

    for (var i = 0; i < lineItems.length; i++) {
        // console.log('building slider for line item ' + i);
        let itemPrice = pricesPaid[i];
        let slider = document.createElement('div');
        let priceSplit = splitItemPrice(50, itemPrice);

        slider.innerHTML = '<fieldset style="flex-direction:column;margin-top:16px;margin-bottom:16px;"><table>' +

                           '<tr><td class="leftPrice" id="slider' + i+ 'LeftDollar" style="text-align:left; font-size:smaller; cursor:pointer;" onclick="updateSliderValues(0, ' + i + ', ' + itemPrice + ');">$' + Number(priceSplit.left).toFixed(2) + '</td>' +
                           '<td class="rightPrice" id="slider' + i+ 'RightDollar" style="text-align:right;  font-size:smaller; font-size:smaller; cursor:pointer;" onclick="updateSliderValues(100, ' + i + ', ' + itemPrice + ');">$' + Number(priceSplit.right).toFixed(2) + '</td></tr>' +

                           '<tr><td colspan="2"><input type="range" min="0" max="100" value="50" step="5" id="slider' + i + '" oninput="updateSliderValues(value, ' + i + ', ' + itemPrice + ');"></input></td></tr>' +

                           '<tr><td id="slider' + i + 'LeftPercent" style="text-align:left;  font-size:smaller; cursor:pointer;" onclick="updateSliderValues(0, ' + i + ', ' + itemPrice + ');">50%</td>' +
                           '<td id="slider' + i + 'RightPercent" style="text-align:right;  font-size:smaller; cursor:pointer;" onclick="updateSliderValues(100, ' + i + ', ' + itemPrice + ');">50%</td></tr>' +

                           '</table></fieldset>';
        lineItems[i].style.maxWidth = '1200px';
        lineItems[i].insertBefore(slider, lineItems[i].querySelector('div.PH-ProductCard-buttons-container'));
        //lineItems[i].insertBefore(slider, lineItems[i]);
    }

    // append to the end
    // var totals = document.createElement('div');

    // totals.innerHTML = '<span id="leftTotal" style="padding-top: 1em;">Left Total: ???</span>' +
                       // '<span id="rightTotal" style="padding-left: 2em; padding-top:1em;">Right Total: ???</span>';

    // document.getElementsByClassName('PurchaseDetail-footerValue')[0].appendChild(totals);

    let totalElement = document.querySelector('div.PurchaseDetail-boldItem');

    let leftTotal = totalElement.cloneNode(true);
    leftTotal.id = 'leftTotalNode';
    leftTotal.querySelector('span.PurchaseDetail-footerItem').innerText = 'Left Total:';
    leftTotal.querySelector('span.PurchaseDetail-footerValue').id = 'leftTotal';
    leftTotal.querySelector('span.PurchaseDetail-footerValue').innerText = '???';

    let rightTotal = totalElement.cloneNode(true);
    rightTotal.id = 'rightTotalNode';
    rightTotal.querySelector('span.PurchaseDetail-footerItem').innerText = 'Right Total:'
    rightTotal.querySelector('span.PurchaseDetail-footerValue').id = 'rightTotal';
    rightTotal.querySelector('span.PurchaseDetail-footerValue').innerText = '???';

    let footerContainer = document.querySelector('div.PurchaseDetail-footerLeftContainer');
    footerContainer.removeChild(document.querySelector('div.PurchaseDetail-footerDisclaimer'));
    footerContainer.appendChild(leftTotal);
    footerContainer.appendChild(rightTotal);

    getTotals();

    // clear the interval timer so we don't keep trying to put sliders on forever
    // clearInterval(sliderInterval);
    // sliderInterval = null;

    // turn the interval back on if we go back to the purchases list
    // var listButton = document.getElementsByClassName('DigitalReceipt-expandoButton')[0];
    // listButton.setAttribute("onclick", "window.sliderInterval = setInterval(function() {appendSliders();}, 1000)");

    return lineItems.length > 0;
}

function getPricesPaid(lineItems) {
    var pricesPaid = [];
    for (var i = 0; i < lineItems.length; i++) {
        var totalPrice = lineItems[i].querySelector('div.PH-ProductCard-Total-Price');
        // console.log('looking at line item ' + i);
        if (totalPrice.getElementsByClassName('PH-ProductCard-section-yellowTag') && lineItems[i].getElementsByClassName('PH-ProductCard-section-yellowTag').length > 0) {
            // console.log('yellow tag for' + lineItems[i].innerText);
            pricesPaid.push(totalPrice.getElementsByClassName('PH-ProductCard-section-yellowTag')[0].innerText.replace('$', ''));
        } else {
            pricesPaid.push(totalPrice.getElementsByClassName('PH-ProductCard-section-value')[0].innerText.replace('$', ''));
        }
    }
    console.log('got ' + pricesPaid.length + ' prices paid');
    return pricesPaid;
}

function getTotals() {
    var leftPrices = document.getElementsByClassName('leftPrice');
    var rightPrices = document.getElementsByClassName('rightPrice');
    var leftTotal = 0;
    var rightTotal = 0;
    for (var i = 0; i < leftPrices.length; i++) {
        leftTotal += Number(leftPrices[i].innerText.replace('$', ''));
        rightTotal += Number(rightPrices[i].innerText.replace('$', ''));
    }

    //console.log('left subtotal: ' + leftTotal);
    //console.log('right subtotal: ' + rightTotal);

    var rightTotalPercent = rightTotal / (leftTotal + rightTotal) * 100;
    //console.log('right subtotal percent: ' + rightTotalPercent);

    // find the tax
    var footerItems = document.querySelectorAll('div.PurchaseDetail-footerItemBlock');
    console.log('found ' + footerItems.length + ' footer items');
    var taxAmount = 0;
    for (var k = 0; k < footerItems.length; k++) {
        if (footerItems[k].innerText.includes('Tax')) {
            taxAmount = Number(footerItems[k].innerText.replace('Tax', '').replace(':', '').replace('$', '').trim());
            console.log('found tax: ' + taxAmount);
            break;
        }
    }

    var taxSplit = splitItemPrice(rightTotalPercent, taxAmount);
    // console.log('left tax: ' + taxSplit.left);
    // console.log('right tax: ' + taxSplit.right);

    leftTotal += Number(taxSplit.left);
    rightTotal += Number(taxSplit.right);

    document.querySelector('#leftTotal').innerText = 'Left Total: $' + Number(leftTotal).toFixed(2);
    document.querySelector('#rightTotal').innerText = 'Right Total: $' + Number(rightTotal).toFixed(2);
};

function splitItemPrice(rightPercent, itemPrice) {
    // console.log('-------------------------');
    var perfectLeftPrice = itemPrice * ((100 - rightPercent) / 100);
    var perfectRightPrice = itemPrice * (rightPercent / 100);
    // console.log('perfect left: ' + perfectLeftPrice);
    // console.log('perfect right: ' + perfectRightPrice);

    var results = {
        left: Number(perfectLeftPrice.toFixed(2)),
        right: Number(perfectRightPrice.toFixed(2))
    };

    // console.log('rounded left: ' + results.left);
    // console.log('rounded right: ' + results.right);

    var initialSum = Number(Number(results.left) + Number(results.right)).toFixed(2);
    // console.log('preliminary sum: ' + initialSum);

    if (initialSum > Number(itemPrice)) {
        // console.log('initial sum ' + initialSum + ' is greater than ' + itemPrice);

        // find out which remainder is larger, subtract one cent to the largest one
        if ((+perfectLeftPrice - results.left) > (+perfectRightPrice - results.right)) {
            results.left = (+results.left - 0.01).toFixed(2);
        } else {
            results.right = (+results.right - 0.01).toFixed(2);
        }
    } else if (initialSum < Number(itemPrice)) {
        // console.log('initial sum ' + initialSum + 'is less than ' + itemPrice);

        // find out which remainder is larger, add one cent to the largest one
        if ((+perfectLeftPrice - results.left) < (+perfectRightPrice - results.right)) {
            results.left = (+results.left + 0.01).toFixed(2);
        } else {
            results.right = (+results.right + 0.01).toFixed(2);
        }
    }
    // console.log('-------------------------');

    return results;
};

window.updateSliderValues = function(sliderValue, sliderNumber, itemPrice) {
    // set the percents
    // console.log('updating slider ' + sliderNumber + ' to ' + sliderValue);
    document.querySelector('#slider' + sliderNumber + 'LeftPercent').innerText = (100 - sliderValue) + "%";
    document.querySelector('#slider' + sliderNumber + 'RightPercent').innerText = sliderValue + "%";

    // set the dollar amounts
    var priceSplit = splitItemPrice(sliderValue, itemPrice);
    document.querySelector('#slider' + sliderNumber + 'LeftDollar').innerText = ('$' + Number(priceSplit.left).toFixed(2));
    document.querySelector('#slider' + sliderNumber + 'RightDollar').innerText = ('$' + Number(priceSplit.right).toFixed(2));


    // set the slider position (this is in case we have set it to 0% or 100% by clicking either side, in which case the slider was not the source of the change)
    document.querySelector('#slider' + sliderNumber).value = sliderValue;

    // total up everything, since something just changed
    getTotals();
};

//window.onhashchange = function() {
// setTimeout(function() {
//     appendSliders();
// }, 1000);
//};

//window.sliderInterval = setInterval(function() {
//    appendSliders();
//}, 2000);

setTimeout(function() {
    appendSliders();
}, 5000);
