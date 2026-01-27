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
            // The infrastructure broke the trace, but Application Data saved it.
            // We verify we received the ID.
            Span.current().setAttribute("app.restored_trace_parent", appTraceRef);

            // In a full implementation, we would use a Propagator here.
            // For this demo, the attribute proves the connection.
            System.out.println("Restored Connection to Trace: " + appTraceRef);
        }

        return "Shipped (Trace Recovery: " + (appTraceRef != null) + ")";
    }
}
