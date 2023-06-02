## BTC Address Balance Chart Challenge

Create an area or line chart that displays an all-time historic view on btc address balances.

Draw 5 lines in different colors displaying balances
- over $1k
- over $10k
- over $100k
- over $1M
- over $10M

Display a legend that labels each line color.

See "Example Implementation" to get an idea of how the chart should look like.
An ideal implementation would include all features you can see in the example.

### Implementation Notes:

* Use a charting engine you feel most comfortable with
* Use the static data provided (`data/Coin_Metrics_Network_Data_2023-02-02T14-32.csv`) to build an API method
(`pages/api/btc-addresses`)
  * Format the CSV and return JSON timeseries for your charting engine
  * Call the API to load the data inside of your react component
* Make the chart look nice and clean (either by utilizing the example as a design template or give it your personal UI touch)

## Bonus Points

* Add buttons and filter functionality to filter the chart by YTD, 12M, 3M and 1M.
* Improve performance by leveraging server side rendering

## Example Implementation

![chart1.png](chart1.png)

![chart2.png](chart2.png)

![chart3.png](chart3.png)
