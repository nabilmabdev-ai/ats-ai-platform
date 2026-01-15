import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { UserTasksService } from './user-tasks.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('tasks')
@UseGuards(AuthGuard('jwt'))
export class TasksController {
    constructor(private readonly tasksService: UserTasksService) { }

    @Post()
    create(@Req() req, @Body() dto: any) {
        return this.tasksService.create(req.user.id, dto);
    }

    @Post('suggest')
    async suggest(@Req() req, @Body() body: { context: string }) {
        return this.tasksService.getSuggestions(req.user.id, body.context);
    }

    @Get()
    findAll(@Req() req) {
        return this.tasksService.findAll(req.user.id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: any) {
        return this.tasksService.update(id, dto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.tasksService.delete(id);
    }
}
