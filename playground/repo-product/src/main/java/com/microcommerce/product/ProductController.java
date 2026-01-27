package com.microcommerce.product;

import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import io.opentelemetry.api.trace.Span;

@RestController
public class ProductController {
    private RestTemplate restTemplate = new RestTemplate();

    @GetMapping("/health")
    public String health() {
        return "OK";
    }

    @GetMapping("/products")
    public String getProducts() {
        String shipStatus = "Unknown";
        try {
            // 1. Get Current Trace ID (The "Passport")
            Span currentSpan = Span.current();
            String traceId = currentSpan.getSpanContext().getTraceId();
            String spanId = currentSpan.getSpanContext().getSpanId();

            // 2. Embed it in Application Data (Query Param)
            // Format: 00-traceId-spanId-01 (W3C standard string manually constructed)
            String w3cHeader = "00-" + traceId + "-" + spanId + "-01";

            // 3. Call Legacy with App Data
            // Use /ship-check endpoint which strips headers but passes query params
            String url = "http://legacy-warehouse:80/ship-check?app_trace_ref=" + w3cHeader;
            shipStatus = restTemplate.postForObject(url, null, String.class);

        } catch (Exception e) {
            shipStatus = "Legacy Error: " + e.getMessage();
        }
        return "Product List [Via App-Data Trace: " + shipStatus + "]";
    }
}
