import { Controller, Get, Post, Body, UseGuards, Request, Param } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { AuthGuard } from '../auth/auth.guard';
import { IsString } from 'class-validator';

export class SendMessageDto {
  @IsString()
  recipientId: string;

  @IsString()
  content: string;
}

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @UseGuards(AuthGuard)
  @Get()
  getMessages(@Request() req: any) {
    return this.messagesService.getMessages(req.user.sub);
  }

  @UseGuards(AuthGuard)
  @Get('unread-count')
  getUnreadCount(@Request() req: any) {
    return this.messagesService.getUnreadCount(req.user.sub);
  }

  @UseGuards(AuthGuard)
  @Post()
  sendMessage(@Request() req: any, @Body() body: SendMessageDto) {
    return this.messagesService.sendMessage(req.user.sub, body.recipientId, body.content);
  }

  @UseGuards(AuthGuard)
  @Post(':id/read')
  markAsRead(@Request() req: any, @Param('id') id: string) {
    return this.messagesService.markAsRead(id, req.user.sub);
  }
}
