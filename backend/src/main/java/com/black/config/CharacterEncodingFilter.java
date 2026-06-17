package com.black.config;

import jakarta.servlet.*;
import jakarta.servlet.annotation.WebFilter;
import java.io.IOException;

@WebFilter("/*")
public class CharacterEncodingFilter implements Filter {
    
    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
    }
    
    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) 
            throws IOException, ServletException {
        request.setCharacterEncoding("UTF-8");
        response.setCharacterEncoding("UTF-8");
        response.setContentType("application/json;charset=UTF-8");
        chain.doFilter(request, response);
    }
    
    @Override
    public void destroy() {
    }
}
