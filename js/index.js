'use strict';

const colors = {
  'Bug': '#4E79A7',
  'Dark': '#A0CBE8',
  'Dragon': '#2424b5',
  'Electric': '#F28E2B',
  'Fairy': '#B07AA1',
  'Fighting': '#59A14F',
  'Fire': '#8CD17D',
  'Flying': '#a9cfd4',
  'Ghost': '#B6992D',
  'Grass': '#499894',
  'Ground': '#86BCB6',
  'Ice': '#86BCB6',
  'Normal': '#E15759',
  'Poison': '#FF9D9A',
  'Psychic': '#79706E',
  'Rock': '#453f43',
  'Steel': '#BAB0AC',
  'Water': '#D37295'
}

let fData = 'filtered data'
let uData = 'unfiltered data'
let svgScatterPlot = ''

// Scaling and mapping
let funcs = '' 
const m = {
    width: 1000,
    height: 600,
    marginAll: 50
}

window.onload = function() {
  svgScatterPlot = d3.select('#viz')
    .append('svg')
    .attr('width', m.width)
    .attr('height', m.height)

  // Fetch data
  d3.csv('./data/pokemon.csv')
    .then((data) => {
      fData = data
      uData = data

      makeDropdowns()
      makeLegend()

      funcs = makeAxesAndLabels()
      makeScatterPlot('all', 'all', funcs) // initial scatter plot
  })
  .then(() => {
    let gDropdown = document.getElementById('generation')
    let lDropdown = document.getElementById('legendary')

    d3.select('#generation').on('change', () => {
      makeScatterPlot(gDropdown.value, lDropdown.value, funcs)
    })

    d3.select('#legendary').on('change', () => {
      makeScatterPlot(gDropdown.value, lDropdown.value, funcs)
    })
  })
}

// Make dropdowns for Generations and Legendaries
// See Midterm spec for details
function makeDropdowns() {
  let gDropdown = d3.select('#generation')
  gDropdown.append('option')
    .attr('value', 'all')
    .attr('label', 'all')

  for (let i = 1; i <= 6; i++) {
    gDropdown.append('option')
      .attr('value', i)
      .attr('label', i)
  }

  let lDropdown = d3.select('#legendary')
  lDropdown.append('option')
    .attr('value', 'all')
    .attr('label', 'all')

  lDropdown.append('option')
    .attr('value', 'True')
    .attr('label', 'True')

  lDropdown.append('option')
    .attr('value', 'False')
    .attr('label', 'False')
}

// Make legend based on types and colors
// See Midterm spec for details
function makeLegend() {
  let legend = d3.select('#legend')
  
  let types = []
  for(let type in colors) types.push(type)

  legend.selectAll('circle')
    .data(types)
    .enter()
    .append('circle')
      .attr('cx', 20)
      .attr("cy", (d, i) => 20 + i * 25)
      .attr("r", 7)
      .style("fill", (d) => colors[d])
  
  legend.selectAll("labels")
    .data(types)
    .enter()
    .append("text")
      .attr("x", 40)
      .attr("y", (d, i) => 22 + i * 25)
      .text((d) => d)
      .attr("text-anchor", "left")
      .style("alignment-baseline", "middle")
}

// Draw axes and labels based on the min and max of the dataset
// Returns mapping and scaling functions
function makeAxesAndLabels() {
    const spDef = uData.map((row) => parseFloat(row['Sp. Def']))
    const total = uData.map((row) => parseFloat(row['Total']))

    const limits = findMinMax(spDef, total)

    const funcs = drawAxes(limits, 'Sp. Def', 'Total', svgScatterPlot, 
        {min: m.marginAll, max: m.width - m.marginAll}, {min: m.marginAll, max: m.height - m.marginAll})

    makeLabels()

    return funcs
}
  

// Filter and make scatter plot with trend line
function makeScatterPlot(generation, legendary, funcs) {
  filterRows(generation, legendary)
  plotData(funcs)
}

// Filter rows based on Generation and Legendary
function filterRows(generation, legendary) {
  if (generation == 'all' && legendary == 'all') {
    fData = uData
  } else if (generation == 'all') {
    fData = uData.filter((row) => row['Legendary'] == legendary)
  } else if (legendary == 'all') {
    fData = uData.filter((row) => row['Generation'] == generation)
  } else {
    fData = uData.filter((row) => row['Generation'] == generation && row['Legendary'] == legendary)
  }
}

// Make axes labels
function makeLabels() {
  svgScatterPlot.append('text')
    .attr('x', 475)
    .attr('y', 590)
    .attr('id', 'x-label')
    .style('font-size', '10pt')
    .text('Sp. Def')

  svgScatterPlot.append('text')
    .attr('transform', 'translate(10, 300)rotate(-90)')
    .style('font-size', '10pt')
    .text('Total')
}

// plot all the data points on the SVG
// and add tooltip functionality
function plotData(map) {
  let xMap = map.x
  let yMap = map.y

  // make tooltip
  let div = d3.select('#viz').append('div')
    .attr('class', 'tooltip')
    .style('opacity', 0)

  /*******************************************************
   * Enter, Update, Exit pattern
   *******************************************************/
  // reference to the start of our update
  // append new data to existing points
  let update = svgScatterPlot
    .selectAll('circle')
    .data(fData)

  // add new circles
  update
    .enter()
    .append('circle')
      .attr('cx', xMap)
      .attr('cy', yMap)
      .attr('r', 7)
      .attr('stroke', (d) => colors[d['Type 1']])
      .attr('fill', (d) => colors[d['Type 1']])
      .on('mouseover', (d) => {
        div.transition()
          .duration(200)
          .style('opacity', .9)
        
        let stats = fData.map(function(row) {
          return {
            'Name': row['Name'], 
            'Type 1': row['Type 1'],
            'Type 2': row['Type 2'],
            'Sp. Def': row['Sp. Def'], 
            'Total': row['Total']
          }
        })

        let unique = true
        let names = d['Name'] + ': ' + d['Type 1'] + ' ' + d['Type 2']

        stats.forEach(function(stat) {
          if (d['Name'] != stat['Name'] && d['Sp. Def'] == stat['Sp. Def'] && d['Total'] == stat['Total']) {
            unique = false
            names += '<br/>' + stat['Name'] + ': ' + stat['Type 1'] + ' ' + stat['Type 2']
          }
        })
        
        if (unique) {
          div.html(
            d['Name'] + '<br/>' + 
            d['Type 1'] + ' ' + d['Type 2'])
              .style('left', (d3.event.pageX) + 'px')
              .style('top', (d3.event.pageY - 28) + 'px')
        } else {
          div.html(
            'Multiple Pokémon<br>' + names)
              .style('left', (d3.event.pageX) + 'px')
              .style('top', (d3.event.pageY - 28) + 'px')
        }
      })
      .on('mouseout', (d) => {
        div.transition()
          .duration(500)
          .style('opacity', 0)
      })

  // update.exit() returns the elements we no longer need
  update.exit().remove() // remove old elements
  
  // // animate the update
  // // note: new elements CANNOT be animated
  update.transition().duration(500)
    .attr('cx', xMap)
    .attr('cy', yMap)
    .attr('r', 7)
    .attr('stroke', (d) => colors[d['Type 1']])
    .attr('fill', (d) => colors[d['Type 1']])
  
  /*******************************************
   * Enter, Update, Exit end
   ******************************************/
}

// draw the axes and ticks
// x -> the name of the field on the x axis
// y -> the name of the field on the y axis
// svg -> the svgContainer to draw on
// rangeX -> and object of the form {min: yourXMinimum, max: yourXMaximum}
// rangeY -> and object of the form {min: yourYMinimum, max: yourYMaximum}
function drawAxes(limits, x, y, svg, rangeX, rangeY) {
  // return x value from a row of data
  let xValue = function(d) { return +d[x] }

  // function to scale x value
  let xScale = d3.scaleLinear()
    .domain([limits.xMin, limits.xMax]) // give domain buffer room
    .range([rangeX.min, rangeX.max])

  // xMap returns a scaled x value from a row of data
  let xMap = function(d) { return xScale(xValue(d)) }

  // plot x-axis at bottom of SVG
  let xAxis = d3.axisBottom().scale(xScale)
  svg.append('g')
    .attr('transform', 'translate(0, ' + rangeY.max + ')')
    .attr('id', 'x-axis')
    .call(xAxis)

  // return y value from a row of data
  let yValue = function(d) { return +d[y]}

  // function to scale y
  let yScale = d3.scaleLinear()
    .domain([limits.yMax, limits.yMin]) // give domain buffer
    .range([rangeY.min, rangeY.max])

  // yMap returns a scaled y value from a row of data
  let yMap = function (d) { return yScale(yValue(d)) }

  // plot y-axis at the left of SVG
  let yAxis = d3.axisLeft().scale(yScale)
  svg.append('g')
    .attr('transform', 'translate(' + rangeX.min + ', 0)')
    .attr('id', 'y-axis')
    .call(yAxis)

  // return mapping and scaling functions
  return {
    x: xMap,
    y: yMap,
    xScale: xScale,
    yScale: yScale
  }
}

// find min and max for arrays of x and y
function findMinMax(x, y) {

  // get min/max x values
  let xMin = d3.min(x)
  let xMax = d3.max(x)

  // get min/max y values
  let yMin = d3.min(y)
  let yMax = d3.max(y)

  // return formatted min/max data as an object
  return {
    xMin : xMin,
    xMax : xMax,
    yMin : yMin,
    yMax : yMax
  }
}

// format numbers
function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}
