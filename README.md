# Multimodal AI Landscape
This repository analyses arXiv preprints from 2019 to 2024 to reveal emerging trends in multimodal AI research. The raw data were sourced from [Kaggle](https://www.kaggle.com/datasets/Cornell-University/arxiv), and filtered using targeted search queries. As these queries are approximate, our conclusions  emphasise overall trends supported by robust evidence, rather than precise numerical results.

## Data Filtering

### 1. Identifying Multimodal AI and Specific Modalities

We first identified relevant AI preprints by searching titles and abstracts for common AI terms, further refining the search with the multimodal terms. We then categorised these preprints by performing targeted queries for specific modalities. The search terms and queries used are detailed in the table below.

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

The `data` folder contains the following files:
- `overall-preprint-counts.csv`:  Total counts of multimodal AI preprints from 2019 to 2024.

- `preprint-counts-by-combined-modality-number.csv`: Counts of preprints categorised by the number of modalities combined from 2019 to 2024.

- `preprint-counts-by-modality.csv`: Counts of preprints for individual modalities from 2019 to 2024.

- `modality-combination-breakdown.csv`: Counts of pairwise, triple, and quadruple modality combinations from 2019 to 2024.

- `modality-pairs-2024.csv`: Counts of preprints for modality pairs published in 2024.

- `other-modality-combinations-by-year.csv`: Yearly counts for preprints using less common modality combinations from 2019 to 2024.

