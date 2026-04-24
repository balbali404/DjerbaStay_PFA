import { ReservationApprovalStatus } from "@prisma/client";
import PDFDocument from "pdfkit";
import prisma from "../../config/prisma";

export interface ReservationApprovalRequest {
  approvalStatus: ReservationApprovalStatus;
  approvalNotes?: string;
}

export async function approveReservation(
  requestId: string,
  hotelId: string,
  notes?: string
) {
  const reservation = await prisma.plannerRequest.findFirst({
    where: {
      id: requestId,
      accommodationId: hotelId,
    },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
      accommodation: {
        select: {
          name: true,
          area: true,
          rating: true,
        },
      },
    },
  });

  if (!reservation) {
    throw new Error("Reservation not found");
  }

  if (reservation.approvalStatus !== "PENDING") {
    throw new Error(`Cannot approve reservation with status: ${reservation.approvalStatus}`);
  }

  const updated = await prisma.plannerRequest.update({
    where: { id: requestId },
    data: {
      approvalStatus: "APPROVED",
      approvalNotes: notes ?? null,
      approvedAt: new Date(),
    },
  });

  return updated;
}

export async function rejectReservation(
  requestId: string,
  hotelId: string,
  reason?: string
) {
  const reservation = await prisma.plannerRequest.findFirst({
    where: {
      id: requestId,
      accommodationId: hotelId,
    },
  });

  if (!reservation) {
    throw new Error("Reservation not found");
  }

  if (reservation.approvalStatus !== "PENDING") {
    throw new Error(`Cannot reject reservation with status: ${reservation.approvalStatus}`);
  }

  const updated = await prisma.plannerRequest.update({
    where: { id: requestId },
    data: {
      approvalStatus: "REJECTED",
      approvalNotes: reason ?? null,
      rejectedAt: new Date(),
    },
  });

  return updated;
}

export function generateInvoicePDF(
  reservation: {
    id: string;
    createdAt: Date;
    interests: string;
    days: number;
    persons: number;
    budgetLevel: number;
    transport: string;
    user: { fullName: string; email: string };
    accommodation: { name: string; area: string };
    budgetBreakdown: Record<string, unknown>;
  }
): PDFDocument {
  const doc = new PDFDocument({
    size: "A4",
    margin: 50,
  });

  // Title
  doc
    .fontSize(24)
    .font("Helvetica-Bold")
    .text("FACTURE / INVOICE", { align: "center" })
    .moveDown(0.5);

  // Header
  doc
    .fontSize(10)
    .font("Helvetica")
    .text(`Reference: ${reservation.id}`, { align: "center" })
    .text(`Date: ${reservation.createdAt.toLocaleDateString("en-US")}`, {
      align: "center",
    })
    .moveDown(1);

  // Company Info (Left)
  doc
    .fontSize(12)
    .font("Helvetica-Bold")
    .text("DjerbaStay", 50)
    .fontSize(10)
    .font("Helvetica")
    .text("Tunisia, Djerba Island")
    .text("AI-Powered Travel Planning");

  // Customer Info (Right)
  doc
    .fontSize(12)
    .font("Helvetica-Bold")
    .text("FACTURÉ À / BILL TO", { align: "right" })
    .fontSize(10)
    .font("Helvetica")
    .text(reservation.user.fullName, { align: "right" })
    .text(reservation.user.email, { align: "right" })
    .moveDown(1.5);

  // Trip Details
  doc
    .fontSize(11)
    .font("Helvetica-Bold")
    .text("Détails du Voyage / Trip Details")
    .fontSize(10)
    .font("Helvetica");

  const tripDetails = [
    ["Accommodation / Logement:", reservation.accommodation.name],
    ["Location / Zone:", reservation.accommodation.area || "Djerba"],
    ["Duration / Durée:", `${reservation.days} days / jours`],
    ["Group Size / Nombre de Personnes:", `${reservation.persons} persons / personnes`],
    ["Budget Level / Niveau de Budget:", getBudgetLabel(reservation.budgetLevel)],
    ["Transport Mode / Mode de Transport:", reservation.transport],
    ["Interests / Intérêts:", reservation.interests],
  ];

  tripDetails.forEach(([label, value]) => {
    doc.text(`${label} ${value}`);
  });

  doc.moveDown(1);

  // Budget Breakdown
  doc
    .fontSize(11)
    .font("Helvetica-Bold")
    .text("Breakdown / Décomposition des Coûts");

  doc
    .fontSize(10)
    .font("Helvetica")
    .moveTo(50, doc.y)
    .lineTo(550, doc.y)
    .stroke()
    .moveDown(0.3);

  const budgetData = reservation.budgetBreakdown as Record<string, number>;
  const items: Array<[string, string]> = [];

  if (budgetData.activities_cost)
    items.push(["Activities / Activités", `$${budgetData.activities_cost.toFixed(2)}`]);
  if (budgetData.food_cost)
    items.push(["Meals / Repas", `$${budgetData.food_cost.toFixed(2)}`]);
  if (budgetData.transport_cost)
    items.push(["Transport", `$${budgetData.transport_cost.toFixed(2)}`]);

  items.forEach(([label, value]) => {
    const labelWidth = 400;
    doc.text(label, 50, undefined, { width: labelWidth });
    doc.text(value, labelWidth + 50, doc.y - doc.currentLineHeight(), {
      align: "right",
    });
  });

  doc.moveDown(0.5);
  doc
    .moveTo(50, doc.y)
    .lineTo(550, doc.y)
    .stroke()
    .moveDown(0.3);

  // Total
  const totalCost = budgetData.total_cost || 0;
  doc
    .fontSize(12)
    .font("Helvetica-Bold")
    .text("TOTAL", 50)
    .text(`$${totalCost.toFixed(2)}`, 450, doc.y - doc.currentLineHeight(), {
      align: "right",
    });

  doc.moveDown(2);

  // Footer
  doc
    .fontSize(9)
    .font("Helvetica")
    .text(
      "Thank you for choosing DjerbaStay! Your ML-powered itinerary has been generated to match your travel preferences.",
      { align: "center" }
    )
    .moveDown(0.5)
    .text(
      "Merci d'avoir choisi DjerbaStay! Votre itinéraire alimenté par IA a été généré pour correspondre à vos préférences de voyage.",
      { align: "center" }
    );

  return doc;
}

function getBudgetLabel(level: number): string {
  switch (level) {
    case 1:
      return "Budget ($)";
    case 2:
      return "Standard ($$)";
    case 3:
      return "Premium ($$$)";
    default:
      return "Standard";
  }
}
