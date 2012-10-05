new Highcharts.Chart({
  chart: {
    renderTo: 'container_$eventId',
    type: 'line'
  },
  title: false,
  xAxis: {
    labels: {
      formatter: function() {
        return this.value; // clean, unformatted number for year
      }
    },
    min: 2003.5,
    max: $xMax
  },
  yAxis: {
    title: false,
    labels: {
      formatter: function() {
        return this.value / $divide;
      }
    },
    min: 0,
    max: $yMax
  },
  tooltip: {
    formatter: function() {
      return this.series.name +'<br />'+
             '<b>' + Highcharts.numberFormat(this.y/$divide, 2) + '</b><br />' +
             'on ' + this.x;
    }
  },
  plotOptions: {
    series: {
      animation: false,
      marker: { radius: 1, lineColor: 'black' },
      lineWidth: 1,
      sshadow: false
    }
  },
  series: [
    { name: '$eventName', color:'white', data: []},
    $series
  ]
});
