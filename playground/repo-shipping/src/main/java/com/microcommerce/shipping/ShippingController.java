package com.microcommerce.shipping;

import org.springframework.web.bind.annotation.*;
import io.opentelemetry.api.trace.Span;

@RestController
public class ShippingController {

    @GetMapping("/health")
    public String health() {
        return "OK";
    }

    @PostMapping("/ship")
    public String ship(@RequestParam(value = "app_trace_ref", required = false) String appTraceRef) {

        if (appTraceRef != null) {
            // MANUAL RECONSTRUCTION
            Span.current().setAttribute("app.restored_trace_parent", appTraceRef);

            // HINT for CodePulse: The immediate caller is the Legacy Warehouse (Nginx)
            Span.current().setAttribute("net.peer.name", "legacy-warehouse");
            Span.current().setAttribute("net.peer.port", 80L);

            System.out.println("Restored Connection to Trace: " + appTraceRef);
        }

        return "Shipped (Trace Recovery: " + (appTraceRef != null) + ")";
    }
}
