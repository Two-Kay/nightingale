import React, { Component, Fragment } from "react";
import ProtvistaManager from "protvista-manager";
import DataLoader from "data-loader";
import ProtvistaFeatureAdapter from "protvista-feature-adapter";
import ProtvistaTrack from "protvista-track";
import ProtvistaNavigation from "protvista-navigation";
import ProtvistaSequence from "protvista-sequence";
import ProtvistaColouredSequence from "protvista-coloured-sequence";
import ProtvistaVariation from "protvista-variation";
import ProtvistaVariationGraph from "protvista-variation-graph";
import ProtvistaVariationAdapter from "protvista-variation-adapter";
import ProtvistaInterproTrack from "protvista-interpro-track";
import ProtvistaLinks from "protvista-links";
import NightingaleLinegraphTrack from "nightingale-linegraph-track";
import loadWebComponent from "../utils/load-web-component";
import variantData from "../mocks/variants.json";
import sequence from "../mocks/sequence.json";
import linegraphData from "../mocks/line-graph-chart.json";
import { dataIPR, signatures, withResidues } from "../mocks/interpro";
import { rawContactsHC } from "../mocks/interpro";
import secondaryStructureData from "../mocks/interpro-secondary-structure.json";
import ProtvistaSaver from "protvista-saver";
import ProtvistaOverlay from "protvista-overlay";
import ProtvistaZoomTool from "protvista-zoom-tool";
import Readme from "./Readme";
import readmeContent from "../../../packages/protvista-manager/README.md";

class ProtvistaManagerWrapper extends Component {
  componentDidMount() {
    document.querySelector("#variation-track").data = variantData;
    document.querySelector("#linegraph").data = linegraphData;
    document.querySelector("#interpro-track-residues").data = withResidues;
    document.querySelector("#interpro-track").data = dataIPR;
    document.querySelector("#interpro-track").contributors = signatures;
    document.querySelector("#sequence-track").data = sequence;
    document.querySelector("#sequence-track").fixedHighlight = "400:600";
    document.querySelector("#sequence-coloured-track").data = sequence;
    document.querySelector("#sequence-coloured-track").fixedHighlight =
      "400:600";
    document.querySelector("#sequence-coloured-track-iso").data = sequence;
    document.querySelector("#sequence-coloured-track-iso").fixedHighlight =
      "400:600";
    document.querySelector("#links-track").data = rawContactsHC;
    document.querySelector("#track1").fixedHighlight = "400:600";
    document.querySelector("#track2").fixedHighlight = "400:600";
    document.querySelector("#track3").data = secondaryStructureData;
    document.querySelector("#track3").fixedHighlight = "400:600";
    document.querySelector("#interpro-track").fixedHighlight = "400:600";
    document.querySelector("#interpro-track-residues").fixedHighlight =
      "400:600";
    document.querySelector("#variation-track").fixedHighlight = "400:600";
    document.querySelector("#variation-graph").fixedHighlight = "400:600";
    //Includes a title in the exported file.
    document.querySelector("#saver").preSave = () => {
      const base = document.querySelector("#example");
      const title = document.createElement("h2");
      title.setAttribute("id", "tmp_title_element");
      title.innerHTML = "ProtVista Snapshot";
      base.insertBefore(title, base.firstChild);
    };
    //removes the title from the DOM
    document.querySelector("#saver").postSave = () => {
      document
        .querySelector("#example")
        .removeChild(document.getElementById("tmp_title_element"));
    };

    //Sets the background color of the image to save.
    document.querySelector("#saver").backgroundColor = "#ffffff";
    document.querySelector("#saver2").backgroundColor = "#ddddee";
  }
  render() {
    loadWebComponent("protvista-manager", ProtvistaManager);
    loadWebComponent("protvista-feature-adapter", ProtvistaFeatureAdapter);
    loadWebComponent("protvista-track", ProtvistaTrack);
    loadWebComponent("protvista-navigation", ProtvistaNavigation);
    loadWebComponent("protvista-sequence", ProtvistaSequence);
    loadWebComponent("protvista-coloured-sequence", ProtvistaColouredSequence);
    loadWebComponent("protvista-interpro-track", ProtvistaInterproTrack);
    loadWebComponent("protvista-variation", ProtvistaVariation);
    loadWebComponent("protvista-variation-graph", ProtvistaVariationGraph);
    loadWebComponent("data-loader", DataLoader);
    loadWebComponent("protvista-variation-adapter", ProtvistaVariationAdapter);
    loadWebComponent("protvista-saver", ProtvistaSaver);
    loadWebComponent("protvista-overlay", ProtvistaOverlay);
    loadWebComponent("protvista-zoom-tool", ProtvistaZoomTool);
    loadWebComponent("protvista-links", ProtvistaLinks);
    loadWebComponent("nightingale-linegraph-track", NightingaleLinegraphTrack);

    return (
      <Fragment>
        <Readme content={readmeContent} />
        <protvista-saver element-id="example" id="saver" />
        <protvista-saver
          element-id="just-tracks"
          id="saver2"
          file-name="tracks"
          file-format="jpeg"
        >
          <button>Download Just Tracks</button>
        </protvista-saver>
        <protvista-overlay for="just-tracks" />
        <protvista-manager
          attributes="variantfilters"
          displaystart="1"
          displayend="100"
          id="example"
        >
          <protvista-zoom-tool
            length="770"
            style={{
              float: "right",
              "--button-background": "#00639a",
              "--button-text-color": "#FFFFFF",
              "--button-background-focus": "#00a6d5",
              "--button-border-radius": "4px",
            }}
          >
            <span slot="zoom-in">+</span>
            <span slot="zoom-in-seq">Zoom to Sequence</span>
          </protvista-zoom-tool>
          <protvista-navigation length="770" />
          <div id="just-tracks">
            <protvista-sequence
              length="770"
              id="sequence-track"
              highlight-event="onmouseover"
              use-ctrl-to-zoom
            />
            <protvista-coloured-sequence
              length="770"
              id="sequence-coloured-track"
              scale="hydrophobicity-interface-scale"
              height="10"
              highlight-event="onmouseover"
              use-ctrl-to-zoom
            />
            <protvista-coloured-sequence
              length="770"
              id="sequence-coloured-track-iso"
              scale="isoelectric-point-scale"
              color_range="white:0,dodgerblue:11"
              height="10"
              use-ctrl-to-zoom
            />

            <protvista-links
              id="links-track"
              length="770"
              height={20}
              use-ctrl-to-zoom
            />

            <protvista-track id="track1" length="770" use-ctrl-to-zoom>
              <protvista-feature-adapter id="adapter1">
                <data-loader>
                  <source src="https://www.ebi.ac.uk/proteins/api/features/P05067?categories=PTM" />
                </data-loader>
              </protvista-feature-adapter>
            </protvista-track>
            <protvista-track
              id="track2"
              length="770"
              layout="non-overlapping"
              use-ctrl-to-zoom
            >
              <protvista-feature-adapter id="adapter1">
                <data-loader>
                  <source src="https://www.ebi.ac.uk/proteins/api/features/P05067?categories=PTM" />
                </data-loader>
              </protvista-feature-adapter>
            </protvista-track>
            <protvista-track
              id="track3"
              length="770"
              displaystart="1"
              displayend="80"
              layout="non-overlapping"
              use-ctrl-to-zoom
            />
            <protvista-interpro-track
              id="interpro-track"
              length="770"
              shape="roundRectangle"
              highlight-event="onmouseover"
              expanded
              use-ctrl-to-zoom
            />
            <protvista-interpro-track
              id="interpro-track-residues"
              length="770"
              shape="roundRectangle"
              highlight-event="onmouseover"
              expanded
              use-ctrl-to-zoom
            />

            <nightingale-linegraph-track id="linegraph" length="770" />
            <protvista-variation-graph
              id="variation-graph"
              length="770"
              use-ctrl-to-zoom
            >
              <protvista-variation-adapter>
                <data-loader>
                  <source src="https://www.ebi.ac.uk/proteins/api/variation/P05067" />
                </data-loader>
              </protvista-variation-adapter>
            </protvista-variation-graph>
            <protvista-variation
              id="variation-track"
              length="770"
              use-ctrl-to-zoom
            />
          </div>
        </protvista-manager>
      </Fragment>
    );
  }
}

export default ProtvistaManagerWrapper;
