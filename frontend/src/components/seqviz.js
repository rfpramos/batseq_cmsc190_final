/**
 * @deprecated
 * NOT USED
 * ONLY A TEST FILE FOR SEQVIZ INTEGRATION

 *
 * -------------------------------------------------------------------
 * Comment authored by:
 * Ramnick Francis P. Ramos
 * CINTERLABS Cohort 2024–2025
 * Student Number: 2021-00571
 * Date: 18/12/2025
 * -------------------------------------------------------------------
 */



import { SeqViz } from "seqviz";

export default () => (
  <SeqViz
    name="J23100"
    seq="TTGACGGCTAGCTCAGTCCTAGGTACAGTGCTAGC"
    annotations={[{ name: "promoter", start: 0, end: 34, direction: 1, color: "blue" }]}
  />
);
