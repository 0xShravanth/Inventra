from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models.customer import Customer
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.product import Product
from app.schemas.order import (
    OrderCreate,
    OrderDetailResponse,
    OrderItemResponse,
    OrderSummary,
)
from app.schemas.product import ProductResponse
from app.services.order_service import create_order, delete_order


router = APIRouter(prefix="/api/orders", tags=["Orders"])


@router.post(
    "/",
    response_model=OrderDetailResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_order_route(
    order_in: OrderCreate,
    db: Session = Depends(get_db),
) -> OrderDetailResponse:
    order = create_order(db, order_in)

    # Ensure items + products are available for response mapping
    order = (
        db.query(Order)
        .options(
            joinedload(Order.items).joinedload(OrderItem.product),
            joinedload(Order.customer),
        )
        .filter(Order.id == order.id)
        .first()
    )

    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")

    return OrderDetailResponse(
        id=order.id,
        customer=order.customer,  # relies on from_attributes
        total_amount=order.total_amount,
        created_at=order.created_at,
        items=[
            OrderItemResponse(
                id=item.id,
                product_id=item.product_id,
                product_name=item.product.name,
                sku=item.product.sku,
                quantity=item.quantity,
                price_at_order=item.price_at_order,
            )
            for item in order.items
        ],
    )


@router.get(
    "/",
    response_model=List[OrderSummary],
)
def list_orders(
    db: Session = Depends(get_db),
) -> List[OrderSummary]:
    # Join customers and count items per order
    stmt = (
        select(
            Order.id,
            Order.customer_id,
            Customer.full_name.label("customer_name"),
            Order.total_amount,
            Order.created_at,
            func.count(OrderItem.id).label("items_count"),
        )
        .join(Customer, Customer.id == Order.customer_id)
        .join(OrderItem, OrderItem.order_id == Order.id)
        .group_by(
            Order.id,
            Order.customer_id,
            Customer.full_name,
            Order.total_amount,
            Order.created_at,
        )
        .order_by(Order.created_at.desc())
    )

    rows = db.execute(stmt).all()
    return [
        OrderSummary(
            id=row.id,
            customer_id=row.customer_id,
            customer_name=row.customer_name,
            total_amount=row.total_amount,
            created_at=row.created_at,
            items_count=row.items_count,
        )
        for row in rows
    ]


@router.get(
    "/{order_id}",
    response_model=OrderDetailResponse,
)
def get_order(
    order_id: UUID,
    db: Session = Depends(get_db),
) -> OrderDetailResponse:
    order = (
        db.query(Order)
        .options(
            joinedload(Order.customer),
            joinedload(Order.items).joinedload(OrderItem.product),
        )
        .filter(Order.id == order_id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")
    return OrderDetailResponse(
        id=order.id,
        customer=order.customer,  # relies on from_attributes
        total_amount=order.total_amount,
        created_at=order.created_at,
        items=[
            OrderItemResponse(
                id=item.id,
                product_id=item.product_id,
                product_name=item.product.name,
                sku=item.product.sku,
                quantity=item.quantity,
                price_at_order=item.price_at_order,
            )
            for item in order.items
        ],
    )


@router.delete(
    "/{order_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_order_route(
    order_id: UUID,
    db: Session = Depends(get_db),
) -> None:
    delete_order(db, order_id)


# Dashboard router lives here per contract (same file).
dashboard_router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@dashboard_router.get(
    "/summary",
)
def dashboard_summary(
    db: Session = Depends(get_db),
):
    total_products = db.query(func.count(Product.id)).scalar() or 0
    total_customers = db.query(func.count(Customer.id)).scalar() or 0
    total_orders = db.query(func.count(Order.id)).scalar() or 0
    low_stock_products = (
        db.query(Product)
        .filter(Product.quantity_in_stock < 10)
        .order_by(Product.quantity_in_stock.asc())
        .all()
    )

    return {
        "total_products": total_products,
        "total_customers": total_customers,
        "total_orders": total_orders,
        "low_stock_products": [
            ProductResponse.model_validate(p) for p in low_stock_products
        ],
    }

