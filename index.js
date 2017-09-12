
var casper = require('casper').create()
var fs = require('fs')
fs.write('results.txt', "", 'w')

const url = 'http://atmfinder.cms.com/atmfinder/ATMStatus.aspx'
var requestId
var postingState = false

var stateIndex = 1 //Not 0 as 0th option is 'Select State'
var cityIndex = 1 // ""


casper.on('remote.message', function (msg) {
    // this.echo('remote.message echo ' + msg);
    console.log(msg)
})

casper.on('resource.error', function (error) {
    // this.echo('remote.message echo ' + msg);
    console.log('ERROR' + error)
})

casper.on('resource.requested', function (requestData, request) {
    if (requestData.method == 'POST') {
        // console.log("requested", JSON.stringify(requestData, undefined, 4))
        requestId = requestData.id
        postingState = requestData.postData.indexOf('cmbCity=%20Select%20City') > -1 ? true : false
        console.log("REQUEST: SELECTING", postingState ? "STATE" : "CITY")
    }
});

casper.on('resource.received', function (responseData) {
    if (responseData.id == requestId && responseData.stage == 'end') {
        console.log("RESPONSE")
        // console.log("responseData", JSON.stringify(responseData))
        var that = this
        if (postingState) {
            setTimeout(that.evaluate.bind(that), 2000, chooseCity, cityIndex)
            cityIndex++
        }
        else {
            setTimeout(function () {
                var response = that.evaluate.call(that, scrapeTable, cityIndex, stateIndex)
                response.data.forEach(function (data) {
                    try {
                        fs.write('results.txt', JSON.stringify(data) + '\n', 'a')
                    } catch (err) {
                        console.log("Error writing to file " + err)
                    }
                })
                if (response.next === 'city') {
                    console.log("next page is city")
                    cityIndex++
                }
                else {
                    stateIndex++
                    cityIndex = 1
                }
            }, 2000)
        }
    }
})



function chooseState(stateIndex) {
    var stateSelect = document.querySelector('#cmbState')
    stateSelect.children[stateIndex].selected = 'selected'
    console.log("Selecting State ", stateSelect.children[stateIndex].innerHTML)
    stateSelect.onchange()
}

function chooseCity(cityIndex) {
    var citySelect = document.querySelector('#cmbCity')
    citySelect.children[cityIndex].selected = 'selected'
    console.log("Selecting City ", citySelect.children[cityIndex].innerHTML)
    citySelect.onchange()
}

function scrapeTable(cityIndex, stateIndex) {
    var citySelect = document.querySelector('#cmbCity')
    var stateSelect = document.querySelector('#cmbState')

    var tbody = document.querySelector('#grdATM tbody')
    var rows = Array.prototype.slice.call(tbody.children)
    var newRows = [];

    rows.forEach(function (row, index) {
        if (index == 0) return
        try {
            newRows.push(
                {
                    bank: row.children[1].innerHTML,
                    location: {
                        lat: row.children[2].children[0].getAttribute('href').split('daddr=')[1].split(',')[0],
                        lng: row.children[2].children[0].getAttribute('href').split('daddr=')[1].split(',')[1]
                    },
                    address: row.children[3].innerHTML,
                    city: citySelect.value,
                    state: stateSelect.value
                })
        } catch (err) {
            console.log("No latLng found")
            newRows.push(
                {
                    bank: row.children[1].innerHTML,
                    location: null,
                    address: row.children[3].innerHTML,
                    city: citySelect.value,
                    state: stateSelect.value
                })
        }

    })
    console.log("Scraped : ", JSON.stringify(newRows))

    //Make request for next page
    //Check if all cities in the state are done


    if (cityIndex < citySelect.children.length) {
        citySelect.children[cityIndex].selected = 'selected'
        console.log("\nSelecting City ", citySelect.children[cityIndex].innerHTML)
        citySelect.onchange()
        return { data: newRows, next: 'city' }
    }
    else {
        citySelect.children[0].selected = 'selected'
        stateSelect.children[stateIndex].selected = 'selected'
        console.log("\n\nSelecting State ", stateSelect.children[stateIndex].innerHTML)
        stateSelect.onchange()
        return { data: newRows, next: 'state' }
    }
}

// Opens casperjs homepage
casper.start(url);

casper.then(function thenFunc() {
    this.evaluate(chooseState, stateIndex);
    stateIndex++
});

// casper.waitFor(function () {
//     console.log("waitFor")
//     return this.evaluate(function () {
//         console.log("1st eval")
//         return document.getElementById('cmbCity').children.length > 1
//     })
// }, function () {
//     console.log('second eval')
//     this.evaluate(chooseCity)
// })

casper.run(function runFunc() {
    // this.exit()
});