import { Executable } from 'src/shared/executable';
import { User } from 'src/users/entities/user.entity';
import { WebinarNotFoundException } from 'src/webinars/exceptions/webinar-not-found';
import { WebinarNotOrganizerException } from 'src/webinars/exceptions/webinar-not-organizer';
import { WebinarReduceSeatsException } from 'src/webinars/exceptions/webinar-reduce-seats';
import { WebinarTooManySeatsException } from 'src/webinars/exceptions/webinar-too-many-seats';
import { IWebinarRepository } from 'src/webinars/ports/webinar-repository.interface';

/**
 * Implements the ChangeSeats use case following the recommended
 * domain rules: only an organizer can change seats, without lowering
 * the seats count, and not exceeding the max seats limit.
 */
type Request = {
  user: User;
  webinarId: string;
  seats: number;
};

type Response = void;

export class ChangeSeats implements Executable<Request, Response> {
  constructor(private readonly webinarRepository: IWebinarRepository) {}

  async execute({ webinarId, user, seats }: Request): Promise<Response> {
    // ARRANGE: retrieve the webinar
    const webinar = await this.webinarRepository.findById(webinarId);
    if (!webinar) {
      throw new WebinarNotFoundException();
    }

    // ASSERT: verify user permissions
    if (!webinar.isOrganizer(user)) {
      throw new WebinarNotOrganizerException();
    }

    // ASSERT: enforce no seat reduction
    if (seats < webinar.props.seats) {
      throw new WebinarReduceSeatsException();
    }

    // ACT: update seats
    webinar.update({ seats });

    // ASSERT: ensure not exceeding maximum seats
    if (webinar.hasTooManySeats()) {
      throw new WebinarTooManySeatsException();
    }

    // ACT: persist changes
    await this.webinarRepository.update(webinar);

    return;
  }
}
