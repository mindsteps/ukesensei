# Stem Separation Research Papers

Reference papers backing the model choice for the stem analysis / source separation feature.

| File | Paper | Venue / Source |
|---|---|---|
| `demucs-v1-waveform-domain.pdf` | Défossez et al., "Music Source Separation in the Waveform Domain" | arXiv:1911.13254 |
| `demucs-v3-hybrid-spectrogram-waveform.pdf` | Défossez, "Hybrid Spectrogram and Waveform Source Separation" | arXiv:2111.03600 (ISMIR 2021 MDX Workshop) |
| `demucs-v4-hybrid-transformers-htdemucs.pdf` | Rouard, Massa, Défossez, "Hybrid Transformers for Music Source Separation" | arXiv:2211.08553 (ICASSP 2023) — **htdemucs**, the model this feature targets |
| `kuielab-mdx-net.pdf` | Kim et al., "KUIELAB-MDX-Net: A Two-Stream Neural Network for Music Demixing" | arXiv:2111.12203 (MDX Challenge) |
| `bs-roformer-band-split-rope-transformer.pdf` | Lu et al., "Music Source Separation with Band-split RoPE Transformer" | arXiv:2309.02612 |
| `spleeter-deezer-joss.pdf` | Hennequin et al., "Spleeter: a fast and efficient music source separation tool with pre-trained models" | JOSS, DOI 10.21105/joss.02154 |
| `open-unmix-joss.pdf` | Stöter, Uhlich, Liutkus, Mitsufuji, "Open-Unmix - A Reference Implementation for Music Source Separation" | JOSS, DOI 10.21105/joss.01667 |

See the chat transcript for a full comparison table (quality/SDR, license, speed) and the rationale for picking **htdemucs / htdemucs_6s** as the target model for the Rust/WASM port.
