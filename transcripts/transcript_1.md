# Transcript 1: Solving the Vision API Connection Crisis

### User
i get connection error for images 2 and 4. i suspect that the request was rate limited what happened here?

### Response
The image sizes look standard, so it's unlikely to be a file size issue. It's more likely that TritonAI's gateway is rate-limiting rapid-fire requests or experiencing transient connection drops when processed too quickly. To fix this, I will update `backend/eval/harness.py` to add a 2-second delay between requests and basic retry logic.

### User
[Output showing continued failures for jacket.png and cat.png]

### Response
This "Connection error" suggests the TritonAI Gateway is timing out on certain images or dropping due to encoding. I will update `extract.py` to increase the timeout to 60s and catch specific OpenAI errors to better diagnose if it's a timeout, rate limit, or drop.

### User
[Output showing "Passed: 2/5", HEIC and specific PNGs still failing]

### Response
The most robust solution is to normalize all images to JPEG before sending them. This ensures the payload is in the format most natively supported by the model. I will use `pillow` and `pillow-heif` to read iPhone photos and convert them to standard JPEGs.

### User
the same thing is happening all fails are pointing to image scanning failed

### Response
If normalization didn't work, the gateway might be dropping connections due to request body size. Vision models don't need high-res images for attribute extraction. I will update `extract.py` to be aggressive: 
1. Downsample images to max 1024px.
2. Lower JPEG quality to 75.
3. Remove custom `httpx` logic for a simpler standard client.
This significantly reduces the Base64 payload size to bypass proxy buffer limits.
