new Highcharts.Chart({
  chart: {
    renderTo: 'container_$eventId',
    zoomType: 'xy',
    type: 'line'
  },
  title: {
    text: $eventName
  },
  subtitle: {
    text: 'Drag in the plot area to zoom in'
  },
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
        return formatValue(this.value, $divide, false);
      }
    },
    min: 0,
    max: $yMax,
    minTickInterval: $divide,
    allowDecimals: false
  },
  tooltip: {
    formatter: function() {
      return this.series.name +'<br />'+
             '<b>' + formatValue(this.y, $divide, true) + '</b><br />' +
             'on ' + this.x;
    },
    crosshairs: true
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
    $series
  ]
});
