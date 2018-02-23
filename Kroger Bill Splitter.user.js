// ==UserScript==
// @name         Kroger Bill Splitter
// @namespace    http://devblog.trevorkonya.com
// @version      0.1
// @description  Help split grocery bills on Kroger.com
// @author       Trevor Konya
// @match        https://www.kroger.com/mypurchases*
// @grant        none
// ==/UserScript==

console.log('running Kroger Bill Splitter 0.1 ...');

//setTimeout(function() {
//    var receiptElements = document.getElementsByClassName('ReceiptList-receiptDateLink');
//    console.log('found ' + receiptElements.length + ' receipt elements');
//    for (var i = 0; i < receiptElements.length; ++i) {
//        receiptElements[i].setAttribute("onclick", "tryAppendingSliders();");
//    }
//}, 1000);

window.appendSliders = function() {
    console.log('maybe appending sliders');

    var lineItems = document.getElementsByClassName('ReceiptDetail-rowContainer');

    if (lineItems.length < 1) {
        return 0;
    }
    if (document.getElementsByClassName('leftPrice').length > 0 || document.getElementsByClassName('rightPrice').length > 0) {
        return 0;
    }

    var pricesPaid = document.getElementsByClassName('ReceiptDetail-itemPricePaid');
    console.log('found ' + lineItems.length + ' line items');

    for (var i = 0; i < lineItems.length; i++) {
        console.log('building slider for line item ' + i);
        var itemPrice = pricesPaid[i].innerText.replace('$', '');
        var slider = document.createElement('div');
        var priceSplit = splitItemPrice(50, itemPrice);
        slider.innerHTML = '<fieldset style="margin-left: 500px;">' +
                           '<span class="leftPrice" id="slider' + i+ 'LeftDollar" style="padding-right:2em; width:40px; display:inline-block;">$' + Number(priceSplit.left).toFixed(2) + '</span>' +
                           '<output for="slider' + i + '" id="slider' + i + 'Left" style="padding-right:2em; width:25px; display:inline-block; cursor:pointer;" onclick="updateSliderValues(0, ' + i + ', ' + itemPrice + ');">50%</output>' +
                           '<input type="range" min="0" max="100" value="50" step="5" id="slider' + i + '" oninput="updateSliderValues(value, ' + i + ', ' + itemPrice + ');"></input>' +
                           '<output for="slider' + i + '" id="slider' + i + 'Right" style="padding-left:2em; width:25px; display:inline-block; cursor:pointer;" onclick="updateSliderValues(100, ' + i + ', ' + itemPrice + ');">50%</output>' +
                           '<span class="rightPrice" id="slider' + i+ 'RightDollar" style="padding-left:2em; width:40px; display:inline-block;">$' + Number(priceSplit.right).toFixed(2) + '</span>' +
                           '</fieldset>';
        lineItems[i].parentNode.insertBefore(slider, lineItems[i].nextSibling);
    }

    // append to the end
    var totals = document.createElement('div');
    totals.innerHTML = '<span id="leftTotal" style="padding-top: 1em;">Left Total: ???</span>' +
                       '<span id="rightTotal" style="padding-left: 2em; padding-top:1em;">Right Total: ???</span>';

    document.getElementsByClassName('ReceiptDetail-totalPricePaidFooter')[0].appendChild(totals);

    getTotals();

    // clear the interval timer so we don't keep trying to put sliders on forever
    clearInterval(sliderInterval);
    sliderInterval = null;

    // turn the interval back on if we go back to the purchases list
    var listButton = document.getElementsByClassName('DigitalReceipt-expandoButton')[0];
    listButton.setAttribute("onclick", "window.sliderInterval = setInterval(function() {appendSliders();}, 1000)");

    return lineItems.length > 0;
}

window.getTotals = function() {
    var leftPrices = document.getElementsByClassName('leftPrice');
    var rightPrices = document.getElementsByClassName('rightPrice');
    var leftTotal = 0;
    var rightTotal = 0;
    for (var i = 0; i < leftPrices.length; i++) {
        leftTotal += Number(leftPrices[i].innerText.replace('$', ''));
        rightTotal += Number(rightPrices[i].innerText.replace('$', ''));
    }

    console.log('left subtotal: ' + leftTotal);
    console.log('right subtotal: ' + rightTotal);

    var rightTotalPercent = rightTotal / (leftTotal + rightTotal) * 100;
    console.log('right subtotal percent: ' + rightTotalPercent);

    // find the tax
    var footerItems = document.getElementsByClassName('ReceiptDetail-footerItem');
    var taxAmount = 0;
    for (var k = 0; k < footerItems.length; k++) {
        if (footerItems[k].innerText.includes('Tax:')) {
            taxAmount = Number(footerItems[k].innerText.replace('Tax:', '').replace('$', '').trim());
            console.log('found tax: ' + taxAmount);
            break;
        }
    }

    var taxSplit = splitItemPrice(rightTotalPercent, taxAmount);
    console.log('left tax: ' + taxSplit.left);
    console.log('right tax: ' + taxSplit.right);

    leftTotal += Number(taxSplit.left);
    rightTotal += Number(taxSplit.right);

    document.querySelector('#leftTotal').innerText = 'Left Total: $' + Number(leftTotal).toFixed(2);
    document.querySelector('#rightTotal').innerText = 'Right Total: $' + Number(rightTotal).toFixed(2);
};

window.splitItemPrice = function(rightPercent, itemPrice) {
    console.log('-------------------------');
    var perfectLeftPrice = itemPrice * ((100 - rightPercent) / 100);
    var perfectRightPrice = itemPrice * (rightPercent / 100);
    console.log('perfect left: ' + perfectLeftPrice);
    console.log('perfect right: ' + perfectRightPrice);

    var results = {
        left: Number(perfectLeftPrice.toFixed(2)),
        right: Number(perfectRightPrice.toFixed(2))
    };

    console.log('rounded left: ' + results.left);
    console.log('rounded right: ' + results.right);

    var initialSum = Number(Number(results.left) + Number(results.right)).toFixed(2);
    console.log('preliminary sum: ' + initialSum);

    if (initialSum > Number(itemPrice)) {
        console.log('initial sum ' + initialSum + ' is greater than ' + itemPrice);

        // find out which remainder is larger, subtract one cent to the largest one
        if ((+perfectLeftPrice - results.left) > (+perfectRightPrice - results.right)) {
            results.left = (+results.left - 0.01).toFixed(2);
        } else {
            results.right = (+results.right - 0.01).toFixed(2);
        }
    } else if (initialSum < Number(itemPrice)) {
        console.log('initial sum ' + initialSum + 'is less than ' + itemPrice);

        // find out which remainder is larger, add one cent to the largest one
        if ((+perfectLeftPrice - results.left) < (+perfectRightPrice - results.right)) {
            results.left = (+results.left + 0.01).toFixed(2);
        } else {
            results.right = (+results.right + 0.01).toFixed(2);
        }
    }
    console.log('-------------------------');

    return results;
};

window.updateSliderValues = function(sliderValue, sliderNumber, itemPrice) {
    console.log('updating slider ' + sliderNumber + ' to ' + sliderValue);
    document.querySelector('#slider' + sliderNumber + 'Right').value = sliderValue + "%";
    document.querySelector('#slider' + sliderNumber + 'Left').value = (100 - sliderValue) + "%";

    var priceSplit = splitItemPrice(sliderValue, itemPrice);
    document.querySelector('#slider' + sliderNumber + 'LeftDollar').innerText = ('$' + Number(priceSplit.left).toFixed(2));
    document.querySelector('#slider' + sliderNumber + 'RightDollar').innerText = ('$' + Number(priceSplit.right).toFixed(2));

    document.querySelector('#slider' + sliderNumber).value = sliderValue;
    getTotals();
};

//window.onhashchange = function() {
// setTimeout(function() {
//     appendSliders();
// }, 1000);
//};

window.sliderInterval = setInterval(function() {
    appendSliders();
}, 1000);
