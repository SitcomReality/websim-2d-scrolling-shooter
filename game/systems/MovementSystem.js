export class MovementSystem {
    constructor() {
        this.entities = new Map();
    }

    registerEntity(id, movementComponent) {
        this.entities.set(id, movementComponent);
    }

    unregisterEntity(id) {
        this.entities.delete(id);
    }

    update(deltaTime, inputState) {
        this.entities.forEach((movementComponent, id) => {
            movementComponent.update(deltaTime, inputState);
        });
    }

    setBounds(id, minX, maxX, minY, maxY) {
        const component = this.entities.get(id);
        if (component) {
            component.setBounds(minX, maxX, minY, maxY);
        }
    }

    getPosition(id) {
        const component = this.entities.get(id);
        return component ? component.position : null;
    }

    setPosition(id, x, y) {
        const component = this.entities.get(id);
        if (component) {
            component.setPosition(x, y);
        }
    }

    reset() {
        this.entities.clear();
    }
}

