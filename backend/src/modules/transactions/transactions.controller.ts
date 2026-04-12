import { Controller, Get, Post, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/transaction.dto';

@ApiTags('Transactions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private txService: TransactionsService) {}

  @Post()
  @ApiOperation({ summary: 'Add a transaction (income/expense)' })
  create(@Request() req, @Body() dto: CreateTransactionDto) {
    return this.txService.create(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all transactions (paginated)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findAll(@Request() req, @Query('page') page = 1, @Query('limit') limit = 20) {
    return this.txService.findAll(req.user.id, +page, +limit);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get spending summary by category' })
  getSummary(@Request() req) {
    return this.txService.getSummary(req.user.id);
  }
}
