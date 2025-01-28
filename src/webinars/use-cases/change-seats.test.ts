// Tests unitaires

import { testUser } from "src/users/tests/user-seeds";
import { InMemoryWebinarRepository } from "../adapters/webinar-repository.in-memory";
import { Webinar } from "../entities/webinar.entity";
import { ChangeSeats } from "./change-seats";
import { WebinarNotFoundException } from "../exceptions/webinar-not-found";

describe('Feature : Change seats', () => {
  let webinarRepository: InMemoryWebinarRepository;
    let useCase: ChangeSeats;

    const webinar = new Webinar({
        id: 'webinar-id',
        organizerId: testUser.alice.props.id,
        title: 'Webinar title',
        startDate: new Date('2024-01-01T00:00:00Z'),
        endDate: new Date('2024-01-01T01:00:00Z'),
        seats: 100,
    });

    beforeEach(() => {
        webinarRepository = new InMemoryWebinarRepository([webinar]);
        useCase = new ChangeSeats(webinarRepository);
    });
  // Initialisation de nos tests, boilerplates...
  describe('Scenario: Happy path', () => {
    // Code commun à notre scénario : payload...
    const payload = {
      user: testUser.alice,
      webinarId: 'webinar-id',
      seats: 200,
    };
    it('should change the number of seats for a webinar', async () => {
      // ACT
      await useCase.execute(payload);
      // ASSERT
      const updatedWebinar = await webinarRepository.findById('webinar-id');
      expect(updatedWebinar?.props.seats).toEqual(200);
    });
  });
  describe('Scenario: Webinar does not exist', () => {
    const payload = {
      user: testUser.alice,
      webinarId: 'unknown-webinar-id',
      seats: 200,
    };
    it('should fail', async () => {
      // ACT
      try {
        await useCase.execute(payload);
        fail('should have thrown an error');
      } catch (error) {
        // ASSERT
        expect(error).toBeInstanceOf(WebinarNotFoundException);
      }
    });
  });
});
