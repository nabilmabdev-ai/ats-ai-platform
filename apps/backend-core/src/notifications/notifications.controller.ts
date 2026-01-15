import { Controller, Get, Patch, Param, UseGuards, Query, Body, Req } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('notifications')
@UseGuards(AuthGuard('jwt'))
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    @Get()
    async findAll(@Req() req, @Query('unread') unread: string) {
        const userId = req.user.id;
        const isUnread = unread === 'true';
        return this.notificationsService.findAll(userId, isUnread);
    }

    @Patch('read-all')
    async markAllAsRead(@Req() req) {
        const userId = req.user.id;
        return this.notificationsService.markAllAsRead(userId);
    }

    @Patch(':id/read')
    async markAsRead(@Param('id') id: string, @Req() req) {
        const userId = req.user.id;
        return this.notificationsService.markAsRead(id, userId);
    }
}
