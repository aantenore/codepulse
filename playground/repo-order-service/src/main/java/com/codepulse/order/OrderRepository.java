package com.codepulse.order;

import java.util.HashMap;
import java.util.Map;

public class OrderRepository {
    private Map<String, Order> store = new HashMap<>();

    public Order save(Order order) {
        store.put(order.getId(), order);
        return order;
    }
}
