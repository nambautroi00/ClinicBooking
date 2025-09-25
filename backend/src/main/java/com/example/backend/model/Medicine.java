package com.example.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "Medicines")
public class Medicine {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer medicineId;

    @Column(nullable = false, unique = true)
    private String name;

    private String strength;
    private BigDecimal unitPrice;
    private String note;

    @OneToMany(mappedBy = "medicine")
    private List<PrescriptionItem> prescriptionItems;
}