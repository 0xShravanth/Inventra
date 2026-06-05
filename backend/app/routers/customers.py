from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.customer import Customer
from app.schemas.customer import CustomerCreate, CustomerResponse


router = APIRouter(prefix="/api/customers", tags=["Customers"])


@router.post(
    "/",
    response_model=CustomerResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_customer(
    customer_in: CustomerCreate,
    db: Session = Depends(get_db),
) -> Customer:
    existing = (
        db.query(Customer).filter(Customer.email == customer_in.email).first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Customer with email {customer_in.email} already exists.",
        )

    customer = Customer(
        full_name=customer_in.full_name,
        email=customer_in.email,
        phone_number=customer_in.phone_number,
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer


@router.get(
    "/",
    response_model=List[CustomerResponse],
)
def list_customers(
    db: Session = Depends(get_db),
) -> List[Customer]:
    customers = db.query(Customer).order_by(Customer.created_at.desc()).all()
    return customers


@router.get(
    "/{customer_id}",
    response_model=CustomerResponse,
)
def get_customer(
    customer_id: UUID,
    db: Session = Depends(get_db),
) -> Customer:
    customer = db.get(Customer, customer_id)
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found.",
        )
    return customer


@router.delete(
    "/{customer_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_customer(
    customer_id: UUID,
    db: Session = Depends(get_db),
) -> None:
    customer = db.get(Customer, customer_id)
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found.",
        )

    try:
        db.delete(customer)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete customer with active order history.",
        )

