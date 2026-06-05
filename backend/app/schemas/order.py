from datetime import datetime
from decimal import Decimal
from typing import List
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, computed_field

from .customer import CustomerResponse


class OrderItemCreate(BaseModel):
    product_id: UUID
    quantity: int = Field(ge=1)


class OrderItemResponse(BaseModel):
    id: UUID
    product_id: UUID
    product_name: str
    sku: str
    quantity: int
    price_at_order: Decimal

    model_config = ConfigDict(from_attributes=True)

    @computed_field  # type: ignore[misc]
    @property
    def subtotal(self) -> Decimal:
        return self.price_at_order * self.quantity


class OrderCreate(BaseModel):
    customer_id: UUID
    items: List[OrderItemCreate] = Field(min_length=1)


class OrderSummary(BaseModel):
    id: UUID
    customer_id: UUID
    customer_name: str
    total_amount: Decimal
    created_at: datetime
    items_count: int

    model_config = ConfigDict(from_attributes=True)


class OrderDetailResponse(BaseModel):
    id: UUID
    customer: CustomerResponse
    total_amount: Decimal
    created_at: datetime
    items: List[OrderItemResponse]

    model_config = ConfigDict(from_attributes=True)

