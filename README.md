# Multimodal AI Landscape - [Explorer🔍](https://multimodalai.github.io/multimodal-ai-landscape/)

<div align="left">

[![DOI:10.1038/s42256-025-01116-5](https://zenodo.org/badge/DOI/10.1038/s42256-025-01116-5.svg)](https://doi.org/10.1038/s42256-025-01116-5)
[![arXiv](https://img.shields.io/badge/arXiv-2504.03603-%3CCOLOR%3E.svg)](https://arxiv.org/abs/2504.03603)

</div>

Navigate trends with the [**Interactive Explorer**](https://multimodalai.github.io/multimodal-ai-landscape/).

This repository analyses arXiv preprints from 2019 to 2025 to reveal emerging trends in multimodal AI research. 
The raw data were sourced from [Kaggle arXiv Dataset](https://www.kaggle.com/datasets/Cornell-University/arxiv), and filtered using targeted search queries. 

As arXiv metadata are subject to retrospective updates, counts may vary between dataset snapshots.
In addition, the query process is inherently approximate.
The reported numbers should therefore be interpreted as indicators of overall trends rather than exact totals.

The paper version is archived as the v2025 release.

*arXiv metadata snapshot: 11 January 2026.*

## Data Filtering

### 1. Identifying Multimodal AI and Specific Modalities

We first identified relevant AI preprints by searching titles and abstracts for common AI terms, 
further refining the search with the multimodal terms. 
We then categorised these preprints by performing targeted queries for specific modalities. 
The search terms and queries used are detailed in the query table below.

### 2. Query Table
| **Terms**            | **Queries**                                                                                      |
|----------------------|--------------------------------------------------------------------------------------------------|
| **AI**               | "AI", "A.I.", "artificial intelligence", "machine learning", "deep learning", "neural network"   |
| **Multimodal**       | "multimodal", "multi-modal"                                                                      |
| **Vision**           | "vision", "image", "video", "visual"                                                             |
| **Language**         | "text", "language", "textual"                                                                    |
| **Time series**      | "time series", "temporal"                                                                        |
| **Graph**            | "graph", "relational"                                                                            |
| **Audio**            | "audio", "acoustic", "speech", "sound", "voice", "phonetic", "music"                             |
| **Spatial**          | "spatial", "geospatial", "geographic", "GIS"                                                     |
| **Sensor**           | "sensor", "IoT", "sensory", "wearable", "RFID", "LiDAR", "radar", "Internet of Things"           |
| **Tabular**          | "tabular", "structured", "spreadsheet", "table", "categorical"                                   |
---


## Data Files

The `data` folder contains the raw data, as follows:
- [`overall-preprint-counts.csv`](https://github.com/multimodalAI/multimodal-ai-landscape/blob/main/data/overall-preprint-counts.csv): Counts of multimodal AI preprints.

- [`preprint-counts-by-combined-modality-number.csv`](https://github.com/multimodalAI/multimodal-ai-landscape/blob/main/data/preprint-counts-by-combined-modality-number.csv): Counts of preprints for different numbers of modalities combined.

- [`preprint-counts-by-modality.csv`](https://github.com/multimodalAI/multimodal-ai-landscape/blob/main/data/preprint-counts-by-modality.csv): Counts of individual modalities.

- [`modality-combination-breakdown.csv`](https://github.com/multimodalAI/multimodal-ai-landscape/blob/main/data/modality-combination-breakdown.csv): Counts of pairwise, triple, and quadruple modality combinations.

- `modality-pairs-YYYY.csv`: Counts of preprints by modality pair for a given year (e.g., [`2024`](https://github.com/multimodalAI/multimodal-ai-landscape/blob/main/data/modality-pairs-2024.csv), [`2025`](https://github.com/multimodalAI/multimodal-ai-landscape/blob/main/data/modality-pairs-2025.csv)).

- [`other-modality-combinations-by-year.csv`](https://github.com/multimodalAI/multimodal-ai-landscape/blob/main/data/other-modality-combinations-by-year.csv): Counts for preprints using less common modality combinations.

## Citation
```
@article{liu2025towards,
  title={Towards deployment-centric multimodal AI beyond vision and language},
  author={Liu, Xianyuan and Zhang, Jiayang and Zhou, Shuo and van der Plas, Thijs L. and Vijayaraghavan, Avish and Grishina, Anastasiia and Zhuang, Mengdie and Schofield, Daniel and Tomlinson, Christopher and others},
  journal={Nature Machine Intelligence},
  volume={7},
  pages={1612--1624},
  year={2025},
  doi={10.1038/s42256-025-01116-5}
}
```
