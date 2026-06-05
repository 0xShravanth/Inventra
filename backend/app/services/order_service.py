from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.models.customer import Customer
from app.models.order import Order
from app.models.order_item import OrderItem
from app.schemas.order import OrderCreate
from .inventory_service import check_and_reserve_stock, restore_stock


def create_order(db: Session, order_data: OrderCreate) -> Order:
    """Create an order with atomic transaction semantics."""
    try:
        # Step 1: Verify customer exists
        customer = db.get(Customer, order_data.customer_id)
        if not customer:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Customer does not exist.",
            )

        # Step 2: Check and reserve stock (validation only)
        reservations = check_and_reserve_stock(db, order_data.items)

        # Atomic transaction block
        order = Order(
            customer_id=order_data.customer_id,
            total_amount=0,
        )
        db.add(order)
        db.flush()  # assign order.id

        # Step 4: Create items and deduct stock
        created_items: list[OrderItem] = []
        for product, qty, price_at_order in reservations:
            order_item = OrderItem(
                order=order,
                product_id=product.id,
                quantity=qty,
                price_at_order=price_at_order,
            )
            product.quantity_in_stock -= qty
            db.add(order_item)
            created_items.append(order_item)

        db.flush()

        # Step 5 & 6: Compute and set total_amount
        total_amount = sum(
            item.quantity * item.price_at_order for item in created_items
        )
        order.total_amount = total_amount

        # Step 7: Commit and refresh
        db.commit()
        db.refresh(order)
        return order
    except Exception:
        db.rollback()
        raise


def delete_order(db: Session, order_id: UUID) -> None:
    """Delete an order and restore product stock within a single transaction."""
    try:
        order: Order | None = (
            db.query(Order)
            .options(
                joinedload(Order.items),
            )
            .filter(Order.id == order_id)
            .first()
        )
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found.",
            )

        # Step 2: Restore stock
        restore_stock(db, list(order.items))

        # Step 3: Delete order (cascade removes items)
        db.delete(order)

        # Step 4: Commit
        db.commit()
    except Exception:
        db.rollback()
        raise

