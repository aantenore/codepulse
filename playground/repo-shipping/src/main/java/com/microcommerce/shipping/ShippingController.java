package com.microcommerce.shipping;

import org.springframework.web.bind.annotation.*;
import io.opentelemetry.api.trace.Span;
import io.opentelemetry.api.common.AttributeKey;
import io.opentelemetry.api.common.Attributes;

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

            // HINT for CodePulse: Emit an EVENT that FlowReconciler understands
            // We use a special prefix "Caller:" to signal our UI template to reverse the
            // arrow.
            Span.current().addEvent("external_api_call",
                    Attributes.of(AttributeKey.stringKey("api.operation"), "Caller: legacy-warehouse"));

            System.out.println("Restored Connection to Trace: " + appTraceRef);
        }

        return "Shipped (Trace Recovery: " + (appTraceRef != null) + ")";
    }
}
