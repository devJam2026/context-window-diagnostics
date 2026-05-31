# 📐 Token Budgeting & Telemetry Mathematics

To prevent downstream failures, a context gateway must treat input prompts not as arbitrary text strings, but as **rigid byte streams** mapped to numeric token sequences. This guide outlines the exact mathematical models and profiling equations built into our diagnostics middleware.

---

## 1. Core Telemetry Equations

### 1.1 Available Input Budget Formula ($A_{\text{input}}$)
The absolute permitted allocation of tokens for the incoming prompt payload is computed dynamically as:

$$A_{\text{input}} = C_{\text{max}} - T_{\text{reserved}} - \lceil C_{\text{max}} \times M_{\text{safety}} \rceil$$

Where:
* $C_{\text{max}}$ is the **total structural capacity** of the model architecture preset (e.g., $8,192$ tokens for standard context).
* $T_{\text{reserved}}$ is the **response allocation pool** (the maximum tokens reserved for the model's output generation).
* $M_{\text{safety}}$ is the **defensive padding percentage** (defaults to $10\%$, protecting against discrepancies between local counting and commercial provider APIs).

### 1.2 Context Budget Utilization Ratio ($U$)
The density ratio of the active payload against the safe input threshold is calculated as:

$$U = \frac{T_{\text{used}}}{A_{\text{input}}}$$

Where $T_{\text{used}}$ represents the cumulative token footprint of all active prompt segments:

$$T_{\text{used}} = T_{\text{system}} + T_{\text{history}} + T_{\text{documents}} + T_{\text{tools}} + T_{\text{input}} + T_{\text{summary}}$$

---

## 2. Dynamic Metric Calculations

### 2.1 Remaining Tokens ($T_{\text{remaining}}$)
The available budget headroom before reaching safety thresholds:

$$T_{\text{remaining}} = \max(0, A_{\text{input}} - T_{\text{used}})$$

### 2.2 Overflow Tokens ($T_{\text{overflow}}$)
The magnitude of budget violation when a payload exceeds safety parameters:

$$T_{\text{overflow}} = \max(0, T_{\text{used}} - A_{\text{input}})$$

---

## 3. Financial & Latency Cost Projections

### 3.1 Financial Cost Estimation
Enterprise systems track token allocation as a cash liability. To represent this in the UI, we compute estimated transaction costs based on standard model rates (e.g., $gpt-4o-mini$ rates: $0.15$ USD per Million Input Tokens, $0.60$ USD per Million Output Tokens):

$$\text{Estimated Cost (USD)} = \left( T_{\text{used}} \times \frac{0.15}{1,000,000} \right) + \left( T_{\text{reserved}} \times \frac{0.60}{1,000,000} \right)$$

This metric educates developers on how bloated prompts directly trigger API billing inflation.

### 3.2 Latency Category Projections
Prompt processing times scale linearly with payload tokens. We map token sizes to four latency risk categories:
* **Low Latency (Safe):** $T_{\text{used}} < 2,000$ tokens. Network payload is light. High speed response.
* **Moderate Latency (Warning):** $2,000 \le T_{\text{used}} < 5,000$ tokens. Standard processing overhead.
* **High Latency (Critical):** $5,000 \le T_{\text{used}} < 10,000$ tokens. Noticeable processing pauses.
* **Extreme Latency (Saturated):** $T_{\text{used}} \ge 10,000$ tokens. High risk of timeout failures or major execution delays.

---

## 4. Tiktoken Tokenization Mechanics
The gateway tokenizes payload strings using `tiktoken`'s `cl100k_base` BPE (Byte Pair Encoding) tokenizer. 

```
[Raw Input Text String]
           │
           ▼
[Unicode Normalization]
           │
           ▼
[Byte Pair Encoding Match]  ──► Matches character patterns to cl100k vocab IDs
           │
           ▼
[Numeric Token ID Array]    ──► Length of this array represents the exact Token Count
```

To maintain low latency profiles under **15ms**, we implement **SHA-256 Content Hash Caching**:
* For immutable session pieces (e.g. historical chat turns or static retrieved articles), the backend computes the SHA-256 hash of the content text.
* The token count is cached in a fast in-memory dictionary.
* Subsequent analysis requests check the cache before invoking `tiktoken` bindings, saving valuable CPU cycles.
