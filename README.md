# casper-atm
Casperjs scraper for ATM data from http://atmfinder.cms.com/atmfinder/ATMStatus.aspx
Ruled out phantomjs prematurely. Porbably could have been done with phantomjs itself.
Cheerio could not be used as the data was loaded async 

Learnings: 
http://docs.casperjs.org/en/latest/modules/casper.html#evaluate  lead to better understanding of scope in js
