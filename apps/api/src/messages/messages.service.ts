import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  async getMessages(userId: string) {
    return this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId },
          { recipientId: userId }
        ]
      },
      include: {
        sender: { include: { doctorProfile: true, patientProfile: true, } },
        recipient: { include: { doctorProfile: true, patientProfile: true, } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async sendMessage(senderId: string, recipientId: string, content: string) {
    // Create message and notification in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const message = await tx.message.create({
        data: {
          senderId,
          recipientId,
          content
        },
        include: {
          sender: { 
            include: { 
              doctorProfile: true, 
              patientProfile: true 
            } 
          }
        }
      });

      // Create notification for recipient
      const senderName = message.sender.doctorProfile 
        ? `Dr. ${message.sender.doctorProfile.firstName} ${message.sender.doctorProfile.lastName}`
        : message.sender.patientProfile
        ? `${message.sender.patientProfile.firstName} ${message.sender.patientProfile.lastName}`
        : 'Someone';

      await tx.notification.create({
        data: {
          userId: recipientId,
          type: 'NEW_MESSAGE',
          status: 'PENDING',
          deliveryMethod: 'IN_APP',
          appointmentId: null
        }
      });

      return message;
    });

    return result;
  }

  async getUnreadCount(userId: string) {
    return this.prisma.message.count({
      where: {
        recipientId: userId,
        read: false
      }
    });
  }

  async markAsRead(messageId: string, userId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId }
    });

    if (message && message.recipientId === userId) {
      return this.prisma.message.update({
        where: { id: messageId },
        data: { read: true }
      });
    }

    return null;
  }
}
