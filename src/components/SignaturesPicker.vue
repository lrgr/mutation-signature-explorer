<template>
    <div>
      <h3>Select signatures</h3>
      <span id="preset-source">
        <label>Source: </label>
        <select v-model="selectedCancerTypeMapGroup">
            <option v-for="pctg in cancerTypeMapGroups" :key="pctg" :value="pctg" :selected="pctg === selectedCancerTypeMapGroup ? 'selected' : ''">{{ pctg }}</option>
        </select>
      </span>
      <div id="signaturePicker"></div>
      <VSpinner v-if="loading" class="spinner"/>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { select as d3_select } from 'd3-selection';
import { scaleBand as d3_scaleBand } from 'd3-scale';
import { set as d3_set } from 'd3-collection';
import { axisTop as d3_axisTop, axisLeft as d3_axisLeft } from 'd3-axis';
import API from '../api.js';
import VSpinner from './VSpinner.vue';

export default {
  name: 'SignaturesPicker',
  components: {
    VSpinner
  },
  data: function() {
      return {
          selectedCancerTypeMapGroup: "COSMIC",
          cancerTypeMapGroups: [],
          loading: true,
          allSignaturesSbs: [],
          allSignaturesDbs: [],
          allSignaturesIndel: [],
          selectedSignaturesSbs: [],
          selectedSignaturesDbs: [],
          selectedSignaturesIndel: [],
          cancerTypeMap: [],
          svg: null,
          margin: {
            top: 160,
            right: 30,
            bottom: 10,
            left: 100
          }
      };
  },
  mounted: function() {
        const vm = this;
        API.fetchDataListing().then(function(listing) {
            vm.allSignaturesSbs = listing["signatures"]["SBS"];
            vm.allSignaturesDbs = listing["signatures"]["DBS"];
            vm.allSignaturesIndel = listing["signatures"]["INDEL"];

            vm.cancerTypeMap = listing["cancer_type_map"];

            vm.cancerTypeMapGroups = d3_set(vm.cancerTypeMap.map(el => el["Source"])).values();
            
            vm.loading = false;
            vm.drawPlot();
        });
  },
  beforeDestroy() {
    this.removePlot();
  },
  watch: {
      windowWidth() {
        this.drawPlot();
      },
      selectedCancerTypeMapGroup() {
        this.drawPlot();
      },
      selectedSignaturesSbs(val) {
          this.$emit('choose-sbs', val)
      },
      selectedSignaturesDbs(val) {
          this.$emit('choose-dbs', val)
      },
      selectedSignaturesIndel(val) {
          this.$emit('choose-indel', val)
      }
  },
  computed: {
      width: function() {
          return this.windowWidth*0.8 - this.margin.left - this.margin.right - 60;
      },
      ...mapGetters([
        'windowWidth'
      ])
  },
  methods: {
      getSignature(name) {
        let sig;
        sig = this.allSignaturesSbs.find(el => el.name === name);
        if(sig !== undefined) {
          return [sig, "SBS"];
        }
        sig = this.allSignaturesDbs.find(el => el.name === name);
        if(sig !== undefined) {
          return [sig, "DBS"];
        }
        sig = this.allSignaturesIndel.find(el => el.name === name);
        if(sig !== undefined) {
          return [sig, "INDEL"];
        }
      },
      toggleSignature(name) {
        let [foundSig, foundSigType] = this.getSignature(name);

        let mapping = {
          "SBS": "selectedSignaturesSbs",
          "DBS": "selectedSignaturesDbs",
          "INDEL": "selectedSignaturesIndel"
        }
        for(let sigType of Object.keys(mapping)) {
          if(sigType === foundSigType) {
            let index = this[mapping[sigType]].findIndex((el) => el === name);
            if(index === -1) {
              this[mapping[sigType]].push(name);
            } else {
              this[mapping[sigType]].splice(index, 1);
            }
            return;
          }
        }
      },
      updateHighlights: function() {
        const vm = this;
        const sigNamesSelected = vm.selectedSignaturesSbs
          .concat(vm.selectedSignaturesDbs)
          .concat(vm.selectedSignaturesIndel);
        
        d3_select("#signaturePicker")
          .select("svg")
          .selectAll(".signatureRow")
          .select("rect")
          .attr("fill", (d, i) => {
            if(sigNamesSelected.includes(d)) {
              return "green";
            } else {
              return (i % 2 == 0 ? "#fff" : "#FFF");
            }
          })
        d3_select("#signaturePicker")
          .select("svg")
          .select(".signatureAxis")
          .selectAll("text")
          .attr("font-weight", (d, i) => {
            if(sigNamesSelected.includes(d)) {
              return "bold";
            } else {
              return "normal";
            }
          })
      },
      removePlot: function() {
        d3_select("#signaturePicker").select("svg").remove();
      },
      drawPlot: function () {
            const vm = this;
            vm.removePlot();

            const rowHeight = 11;

            const filteredCancerTypeMap = vm.cancerTypeMap
              .filter(el => el["Source"] === vm.selectedCancerTypeMapGroup)
            
            const cancerTypes = d3_set(filteredCancerTypeMap
              .map(el => el["Cancer Type"])
            ).values();

            const x = d3_scaleBand()
              .domain(cancerTypes)
              .range([0, vm.width]);

            const sigNamesSbs = vm.allSignaturesSbs.map((el) => el.name);
            const sigNamesDbs = vm.allSignaturesDbs.map((el) => el.name);
            const sigNamesIndel = vm.allSignaturesIndel.map((el) => el.name);

            const sigNames = sigNamesSbs.concat(sigNamesDbs).concat(sigNamesIndel);
            
            const totalNumSigs = sigNames.length;
            const totalHeight = totalNumSigs * rowHeight;

           
            const y = d3_scaleBand()
              .domain(sigNames)
              .range([0, totalHeight]);
            

            // append svg
            vm.svg = d3_select("#signaturePicker")
              .append("svg")
              .attr("width", this.width + this.margin.left + this.margin.right)
              .attr("height", totalHeight + this.margin.top + this.margin.bottom)
              .append("g")
              .attr("transform",
                  "translate(" + vm.margin.left + "," + vm.margin.top + ")");
            
            const container = vm.svg.append("g");

            const sigRows = container.selectAll(".signatureRow")
                .data(sigNames)
            .enter().append("g")
                .attr("class", "signatureRow");
            
            sigRows.append("rect")
              .style("cursor", "pointer")
              .attr("width", vm.width)
              .attr("height", rowHeight)
              .attr("x", 0)
              .attr("y", (d) => y(d))
              .attr("fill-opacity", 0.2)
              .on("click", (d) => {
                vm.toggleSignature(d);
                vm.updateHighlights();
                // TODO: emit
              });
            
            container.selectAll(".signatureCell")
                .data(filteredCancerTypeMap)
            .enter().append("rect")
                .style("pointer-events", "none")
                .attr("class", "signatureCell")
                .attr("width", x.bandwidth() - 4)
                .attr("height", rowHeight - 4)
                .attr("x", (d) => x(d["Cancer Type"]) + 2)
                .attr("y", (d) => y(d["Signature"]) + 2)
                .attr("fill", "dimgray");
            
            const highlightY = container.append("g")
              .append("rect")
                .style("pointer-events", "none")
                .attr("width", vm.width)
                .attr("height", rowHeight)
                .attr("x", 0)
                .attr("y", 0)
                .attr("fill-opacity", 0)
                .attr("fill", "yellow");
            
            const highlightX = container.append("g")
              .append("rect")
                .style("pointer-events", "none")
                .attr("width", x.bandwidth())
                .attr("height", totalHeight)
                .attr("x", 0)
                .attr("y", 0)
                .attr("fill-opacity", 0)
                .attr("fill", "yellow");
            
            sigRows.on("mouseover", (d) => {
              highlightY
                .attr("fill-opacity", 0.5)
                .attr("y", y(d));
            });

            container.on("mouseleave", (d) => {
              highlightY
                .attr("fill-opacity", 0);
            })

            
            // x-axis
            const xAxis = vm.svg.append("g");
            xAxis.call(d3_axisTop(x).tickSizeOuter(0).tickSizeInner(4))
              .selectAll("text")	
                .style("text-anchor", "end")
                .style("cursor", "pointer")
                .attr("dx", "-0.6em")
                .attr("dy", "0.3em")
                .attr("transform", "rotate(45)")
                .on("click", (d) => {
                    const ctSigsAllNames = filteredCancerTypeMap.filter(el => el["Cancer Type"] === d).map(el => el["Signature"]);
                    const ctSigsAll = ctSigsAllNames.map((name) => vm.getSignature(name));

                    const ctSigsSbsNames = ctSigsAll.filter((el) => el[1] === "SBS").map(el => el[0].name);
                    const ctSigsDbsNames = ctSigsAll.filter((el) => el[1] === "DBS").map(el => el[0].name);
                    const ctSigsIndelNames = ctSigsAll.filter((el) => el[1] === "INDEL").map(el => el[0].name);

                    vm.selectedSignaturesSbs = ctSigsSbsNames;
                    vm.selectedSignaturesDbs = ctSigsDbsNames;
                    vm.selectedSignaturesIndel = ctSigsIndelNames;
                    vm.updateHighlights();
                })
                .on("mouseover", (d) => {
                    highlightX
                      .attr("fill-opacity", 0.5)
                      .attr("x", x(d));
                })
                .on("mouseleave", () => {
                    highlightX
                      .attr("fill-opacity", 0);
                });
            
            // y-axis
            const yAxis = vm.svg.append("g")
              .attr("class", "signatureAxis");
            yAxis.call(d3_axisLeft(y).tickSizeOuter(0))
              .selectAll("text")	
                .style("cursor", "pointer")
                .on("click", (d) => {
                  vm.toggleSignature(d);
                  vm.updateHighlights();
                  // TODO: emit
                })
                .on("mouseover", (d) => {
                    highlightY
                      .attr("fill-opacity", 0.5)
                      .attr("y", y(d));
                })
                .on("mouseleave", () => {
                    highlightY
                      .attr("fill-opacity", 0);
                });

            vm.updateHighlights();
            
      }
  }
}
</script>

<style scoped lang="scss">
@import './../style/variables.scss';

#signaturePicker {
            position: relative;
            overflow-x: hidden;
            overflow-y: hidden;
            #signaturePickerCheckboxes {
                position: absolute;
                top: 125px;
                width: 100px;
                text-align: right;
                .tooltip {
                    label {
                        font-size: 11px;
                    }
                    input[type=checkbox] {
                        transform: scale(0.8);
                    }
                }
            }
        }

</style>