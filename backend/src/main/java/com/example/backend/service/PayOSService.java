package com.example.backend.service;

import com.example.backend.model.Payment;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import vn.payos.PayOS;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkRequest;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkResponse;
import vn.payos.model.v2.paymentRequests.PaymentLinkItem;

@Service
@RequiredArgsConstructor
@Slf4j
public class PayOSService {
    
    private final PayOS payOS;
    
    public CreatePaymentLinkResponse createPaymentLink(Payment payment, String returnUrl, String cancelUrl) {
        try {
            log.info("Creating PayOS payment link for payment ID: {}", payment.getPaymentId());
            
            String orderCode = String.valueOf(System.currentTimeMillis());
            // PayOS yêu cầu description tối đa 25 ký tự
            String description = payment.getDescription() != null ? 
                payment.getDescription() : "Thanh toán lịch hẹn";
            
            // Cắt ngắn description nếu quá 25 ký tự
            if (description.length() > 25) {
                description = description.substring(0, 22) + "...";
            }
            
            // Tạo PaymentLinkItem theo PayOS SDK
            String itemName = "Phí khám bệnh #" + payment.getAppointment().getAppointmentId();
            // Cắt ngắn item name nếu quá dài
            if (itemName.length() > 50) {
                itemName = itemName.substring(0, 47) + "...";
            }
            
            // Lấy fee từ appointment thay vì từ payment amount
            long appointmentFee = 0;
            if (payment.getAppointment() != null && payment.getAppointment().getFee() != null) {
                appointmentFee = payment.getAppointment().getFee().longValue();
                log.info("Using appointment fee: {} VND", appointmentFee);
            } else {
                // Fallback nếu không có appointment fee
                appointmentFee = payment.getAmount().longValue();
                log.warn("No appointment fee, using payment amount: {} VND", appointmentFee);
            }
            
            // PayOS yêu cầu amount theo VND (đồng Việt Nam)
            // Appointment fee đã là VND thực tế, không cần chuyển đổi
            long payOSAmount = appointmentFee;
            
            // Log để debug
            log.info("PayOS amount calculation: appointment fee = {}, PayOS amount = {}", 
                appointmentFee, payOSAmount);
            log.info("PayOS will display: {} VND", payOSAmount);
            
            PaymentLinkItem item = PaymentLinkItem.builder()
                .name(itemName)
                .quantity(1)
                .price(payOSAmount)
                .build();
            
            // Tạo CreatePaymentLinkRequest theo PayOS SDK
            CreatePaymentLinkRequest paymentData = CreatePaymentLinkRequest.builder()
                .orderCode(Long.parseLong(orderCode))
                .amount(payOSAmount)
                .description(description)
                .returnUrl(returnUrl != null ? returnUrl : "http://localhost:3000/payment/success")
                .cancelUrl(cancelUrl != null ? cancelUrl : "http://localhost:3000/payment/cancel")
                .item(item)
                .build();
            
            // Gọi PayOS API sử dụng SDK
            CreatePaymentLinkResponse response = payOS.paymentRequests().create(paymentData);
            
            // Cập nhật payment với thông tin từ PayOS
            payment.setPayOSPaymentId(response.getPaymentLinkId());
            payment.setPayOSCode(orderCode);
            payment.setPayOSLink(response.getCheckoutUrl());
            
            log.info("PayOS payment link created successfully for payment ID: {}", payment.getPaymentId());
            return response;
            
        } catch (Exception e) {
            log.error("Error creating PayOS payment link: ", e);
            throw new RuntimeException("Lỗi khi tạo link thanh toán: " + e.getMessage());
        }
    }
    
    public Object getPaymentInfo(String payOSPaymentId) {
        try {
            // Sử dụng PayOS SDK để lấy thông tin payment
            return payOS.paymentRequests().get(Long.parseLong(payOSPaymentId));
        } catch (Exception e) {
            log.error("Error getting PayOS payment info: ", e);
            throw new RuntimeException("Lỗi khi lấy thông tin thanh toán: " + e.getMessage());
        }
    }
    
    
}
