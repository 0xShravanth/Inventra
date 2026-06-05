from decimal import Decimal
from typing import List, Tuple

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.product import Product
from app.models.order_item import OrderItem
from app.schemas.order import OrderItemCreate


def check_and_reserve_stock(
    db: Session, items: List[OrderItemCreate]
) -> List[Tuple[Product, int, Decimal]]:
    """Validate stock availability and return reservation info.

    Does not mutate database state; callers are responsible for applying updates
    within an atomic transaction.
    """
    result: List[Tuple[Product, int, Decimal]] = []

    for item in items:
        product: Product | None = db.get(Product, item.product_id)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid product in order.",
            )

        if product.quantity_in_stock < item.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Insufficient stock for product '{product.name}'. "
                    f"Requested {item.quantity}, available {product.quantity_in_stock}."
                ),
            )

        price_at_order = Decimal(product.price)
        result.append((product, item.quantity, price_at_order))

    return result


def restore_stock(db: Session, order_items: List[OrderItem]) -> None:
    """Restore stock levels for all products in the given order items."""
    for item in order_items:
        product: Product | None = db.get(Product, item.product_id)
        if product is not None:
            product.quantity_in_stock += item.quantity

    db.flush()

