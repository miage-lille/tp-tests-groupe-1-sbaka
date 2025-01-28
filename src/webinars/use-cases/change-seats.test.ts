import { testUser } from 'src/users/tests/user-seeds';
import { InMemoryWebinarRepository } from '../adapters/webinar-repository.in-memory';
import { Webinar } from '../entities/webinar.entity';
import { ChangeSeats } from './change-seats';
import { WebinarNotFoundException } from '../exceptions/webinar-not-found';
import { WebinarNotOrganizerException } from '../exceptions/webinar-not-organizer';
import { WebinarReduceSeatsException } from '../exceptions/webinar-reduce-seats';
import { WebinarTooManySeatsException } from '../exceptions/webinar-too-many-seats';

describe('Feature: Change seats', () => {
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

  // Shared fixtures
  function expectWebinarToRemainUnchanged() {
    const webinar = webinarRepository.findByIdSync('webinar-id');
    expect(webinar?.props.seats).toEqual(100);
  }

  async function whenUserChangeSeatsWith(payload: any) {
    await useCase.execute(payload);
  }

  async function thenUpdatedWebinarSeatsShouldBe(expectedSeats: number) {
    const updatedWebinar = await webinarRepository.findById('webinar-id');
    expect(updatedWebinar?.props.seats).toEqual(expectedSeats);
  }

  describe('Scenario: Happy path', () => {
    const payload = {
      user: testUser.alice,
      webinarId: 'webinar-id',
      seats: 200,
    };

    it('should change the number of seats for a webinar', async () => {
      // ACT
      await whenUserChangeSeatsWith(payload);
      // ASSERT
      await thenUpdatedWebinarSeatsShouldBe(200);
    });
  });

  describe('Scenario: Webinar does not exist', () => {
    const payload = {
      user: testUser.alice,
      webinarId: 'unknown-webinar-id',
      seats: 200,
    };

    it('should fail with WebinarNotFoundException', async () => {
      // ASSERT
      await expect(whenUserChangeSeatsWith(payload)).rejects.toThrow(WebinarNotFoundException);
      expectWebinarToRemainUnchanged();
    });
  });

  describe('Scenario: Update the webinar of another user', () => {
    const payload = {
      user: testUser.bob,
      webinarId: 'webinar-id',
      seats: 200,
    };

    it('should fail with WebinarNotOrganizerException', async () => {
      // ASSERT
      await expect(whenUserChangeSeatsWith(payload)).rejects.toThrow(WebinarNotOrganizerException);
      expectWebinarToRemainUnchanged();
    });
  });

  describe('Scenario: Reduce the number of seats', () => {
    const payload = {
      user: testUser.alice,
      webinarId: 'webinar-id',
      seats: 50,
    };

    it('should fail with WebinarReduceSeatsException', async () => {
      // ASSERT
      await expect(whenUserChangeSeatsWith(payload)).rejects.toThrow(WebinarReduceSeatsException);
      expectWebinarToRemainUnchanged();
    });
  });

  describe('Scenario: Too many seats', () => {
    const payload = {
      user: testUser.alice,
      webinarId: 'webinar-id',
      seats: 1060,
    };

    it('should fail with WebinarTooManySeatsException', async () => {
      // ASSERT
      await expect(whenUserChangeSeatsWith(payload)).rejects.toThrow(WebinarTooManySeatsException);
      expectWebinarToRemainUnchanged();
    });
  });
});
