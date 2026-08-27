package com.retailerp.backend.config;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class SpaController {

    // Forward known client-side routes to index.html; API and asset paths are handled separately.
    @RequestMapping({
            "/login",
            "/dashboard",
            "/inventory",
            "/pos",
            "/sales",
            "/customers",
            "/suppliers",
            "/purchases",
            "/accounting",
            "/reports",
            "/settings",
            "/staff"
    })
    public String forward() {
        return "forward:/index.html";
    }
}